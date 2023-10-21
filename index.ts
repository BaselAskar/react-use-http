/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useCallback, createContext, useContext } from "react";

/* #region Constants */
const CONTENT_TYPE = "Content-Type";
const APPLICATION_JSON = "application/json";

/* #endregion */

/* #region interface */
export interface HttpBuilder {
  baseUrl: string;
  defaultApplyError: (error: any) => void;
  onLogout?: () => void;
  tokenServices?: {
    getToken: () => string | null;
    refreshToken: (response: Response) => void;
    setToken: (jwt: string) => void;
    removeToken: () => void;
  };
}

export interface RequestConfig<TData> {
  url: string;
  method?: "get" | "post" | "put" | "delete";
  header?: Map<string, string>;
  auth?: boolean;
  state?: "one" | "multi";
  preventRefreshToken?: boolean;
  onSuccess?: (response: HttpResponse<TData>) => void;
  dependencies?: any[];
  applyError?: (error: any) => void;
}

export interface HttpResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface RequestParams {
  query?: Object;
  pathParams?: string[];
  body?: object | Array<any> | null;
}

interface AuthType<TUser> {
  user: TUser | null;
  login: (userInfo: TUser) => void;
  logout: () => void;
}

/* #endregion */

/* #region default params */
const defaultCreateHttp: HttpBuilder = {
  baseUrl: "",
  defaultApplyError: (error: any) => {},
  // dispatchHook: useDispatch<Dispatch<AnyAction>>,
};

const defaultRequestConfig: RequestConfig<any> = {
  url: "",
  method: "get",
  header: new Map<string, string>(),
  auth: true,
  state: "one",
  preventRefreshToken: false,
  dependencies: [],
};

const defaultRequestParams: RequestParams = {
  query: {},
  pathParams: [],
  body: null,
};

/* #endregion */
export function httpProviderBuilder<
  TUser extends { token: string } = { token: string }
>(createHttpParams: HttpBuilder = defaultCreateHttp) {
  createHttpParams = { ...defaultRequestConfig, ...createHttpParams };

  const {
    baseUrl,
    defaultApplyError,
    tokenServices: ts,
    onLogout,
  } = createHttpParams;

  // Create authentication context
  const AuthContext = createContext<AuthType<TUser>>({
    user: null,
    login(userInfo) {},
    logout() {},
  });

  const AuthProvider = function ({ children }: React.PropsWithChildren) {
    const [user, setUser] = useState<TUser | null>(null);

    function login(userInfo: TUser) {
      ts?.setToken(userInfo.token);

      setUser(userInfo);
    }

    function logout() {
      ts?.removeToken();
      setUser(null);
      onLogout?.();
    }

    return React.createElement(AuthContext.Provider, {
      value: { user, login, logout },
      children,
    });
  };

  const useAuthStore = () => useContext<AuthType<TUser>>(AuthContext);

  const useHttp = <TResult = any>(reqConfig: RequestConfig<TResult>) => {
    if (!reqConfig.applyError) reqConfig.applyError = defaultApplyError;

    reqConfig = { ...defaultRequestParams, ...reqConfig };

    const [states, setStates] = useState<{ isLoading: boolean; error: any }>({
      isLoading: false,
      error: null,
    });

    const { isLoading, error } = states;

    const { logout: logoutAction } = useAuthStore();

    const request = useCallback(
      async (params: RequestParams = defaultRequestParams) => {
        if (!reqConfig.applyError) reqConfig.applyError = defaultApplyError;

        params = { ...defaultRequestParams, ...params };
        if (isLoading && reqConfig.state === "one") return;

        setStates({ isLoading: true, error: null });

        // path values
        const variablesInUrl =
          params?.pathParams && params.pathParams?.length > 0
            ? "/" + params.pathParams.join("/")
            : "";

        // query values
        let queryParams = "";

        if (params?.query && Object.entries(params.query).length > 0) {
          queryParams += "?";

          Object.entries(params.query)
            .map(([key, value]) => {
              if (value === undefined) return "";

              if (Array.isArray(value)) {
                value.map((v, i) => `${key}[${i}]=${v}`).join("&");
              }

              return `${key}=${value}`;
            })
            .filter((v) => v !== "")
            .join("&");
        }

        // request headers

        const reqHeader = new Headers();

        if (params?.body) {
          if (params.body instanceof FormData) {
          } else {
            reqHeader.append(CONTENT_TYPE, APPLICATION_JSON);
          }
        }

        if (reqConfig.header) {
          reqConfig.header.forEach((value: string, key: string) => {
            reqHeader.append(key, value);
          });
        }

        if (reqConfig.auth && ts) {
          const jwt = ts.getToken();
          if (!jwt) logoutAction();
          reqHeader.append("Authorization", `Bearer ${jwt}`);
        }

        let bodyBuilder: BodyInit | null | undefined;

        if (params.body) {
          if (reqHeader.get(CONTENT_TYPE) === APPLICATION_JSON) {
            bodyBuilder = JSON.stringify(params.body);
          } else if (params.body instanceof FormData) {
            bodyBuilder = params.body;
          }
        }

        try {
          const response = await fetch(
            baseUrl + reqConfig.url + variablesInUrl + queryParams,
            {
              method: reqConfig.method!.toUpperCase(),
              headers: reqHeader,
              body: bodyBuilder,
            }
          );

          if (response.status === 401) {
            logoutAction();
          }

          if (response.status >= 400) {
            throw await response.json();
          }

          if (reqConfig.auth && !reqConfig.preventRefreshToken && ts) {
            ts.refreshToken(response);
          }

          let data: any;

          try {
            data = (await response.json()) as TResult;
          } catch {
            try {
              data = (await response.text()) as TResult;
            } catch {
              data = undefined;
            }
          }

          const httpResponse: HttpResponse<TResult> = {
            data,
            ...response,
          };

          reqConfig?.onSuccess?.(httpResponse);
          setStates({ isLoading: false, error: null });
        } catch (err: any) {
          if (error?.message === "Failed to fetch") {
            logoutAction();
            return;
          }
          setStates({ isLoading: false, error: err });
        }
      },
      [isLoading, ...(reqConfig?.dependencies ?? [])]
    );

    return {
      request,
      isLoading,
      error,
    };
  };

  return {
    useHttp,
    AuthProvider,
    useAuthStore,
  };
}
