var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useCallback, createContext, useContext, useEffect, } from "react";
/* #region Constants */
const CONTENT_TYPE = "Content-Type";
const APPLICATION_JSON = "application/json";
/* #endregion */
/* #region default params */
const defaultCreateHttp = {
    baseUrl: "",
    defaultApplyError: (error) => { },
    // dispatchHook: useDispatch<Dispatch<AnyAction>>,
};
const defaultRequestConfig = {
    url: "",
    method: "get",
    header: new Map(),
    auth: true,
    state: "one",
    preventRefreshToken: false,
    dependencies: [],
};
const defaultRequestParams = {
    query: {},
    pathParams: [],
    body: null,
};
/* #endregion */
export function httpProviderBuilder(createHttpParams = defaultCreateHttp) {
    createHttpParams = Object.assign(Object.assign({}, defaultRequestConfig), createHttpParams);
    const { baseUrl, defaultApplyError, tokenServices: ts, onLogout, } = createHttpParams;
    // Create authentication context
    const AuthContext = createContext({
        user: null,
        login(userInfo) { },
        logout() { },
    });
    const AuthProvider = function ({ children }) {
        const [user, setUser] = useState(null);
        function login(userInfo) {
            ts === null || ts === void 0 ? void 0 : ts.setToken(userInfo.token);
            setUser(userInfo);
        }
        function logout() {
            ts === null || ts === void 0 ? void 0 : ts.removeToken();
            setUser(null);
            onLogout === null || onLogout === void 0 ? void 0 : onLogout();
        }
        return React.createElement(AuthContext.Provider, {
            value: { user, login, logout },
            children,
        });
    };
    const useAuthStore = () => useContext(AuthContext);
    const useHttp = (reqConfig) => {
        var _a;
        if (!reqConfig.applyError)
            reqConfig.applyError = defaultApplyError;
        reqConfig = Object.assign(Object.assign({}, defaultRequestConfig), reqConfig);
        const [states, setStates] = useState({
            isLoading: false,
            error: null,
        });
        const { isLoading, error } = states;
        const { logout: logoutAction } = useAuthStore();
        const request = useCallback((params = defaultRequestParams) => __awaiter(this, void 0, void 0, function* () {
            var _b, _c;
            if (!reqConfig.applyError)
                reqConfig.applyError = defaultApplyError;
            params = Object.assign(Object.assign({}, defaultRequestParams), params);
            if (isLoading && reqConfig.state === "one")
                return;
            setStates({ isLoading: true, error: null });
            // path values
            const variablesInUrl = (params === null || params === void 0 ? void 0 : params.pathParams) && ((_b = params.pathParams) === null || _b === void 0 ? void 0 : _b.length) > 0
                ? "/" + params.pathParams.join("/")
                : "";
            // query values
            let queryParams = "";
            if ((params === null || params === void 0 ? void 0 : params.query) && Object.entries(params.query).length > 0) {
                queryParams += "?";
                queryParams += Object.entries(params.query)
                    .map(([key, value]) => {
                    if (value === undefined)
                        return "";
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
            if (params === null || params === void 0 ? void 0 : params.body) {
                if (params.body instanceof FormData) {
                }
                else {
                    reqHeader.append(CONTENT_TYPE, APPLICATION_JSON);
                }
            }
            if (reqConfig.header) {
                reqConfig.header.forEach((value, key) => {
                    reqHeader.append(key, value);
                });
            }
            if (reqConfig.auth && ts) {
                const jwt = ts.getToken();
                if (!jwt)
                    logoutAction();
                reqHeader.append("Authorization", `Bearer ${jwt}`);
            }
            let bodyBuilder;
            if (params.body) {
                if (reqHeader.get(CONTENT_TYPE) === APPLICATION_JSON) {
                    bodyBuilder = JSON.stringify(params.body);
                }
                else if (params.body instanceof FormData) {
                    bodyBuilder = params.body;
                }
            }
            try {
                const response = yield fetch(baseUrl + reqConfig.url + variablesInUrl + queryParams, {
                    method: reqConfig.method.toUpperCase(),
                    headers: reqHeader,
                    body: bodyBuilder,
                });
                if (response.status === 401) {
                    logoutAction();
                }
                if (response.status >= 400) {
                    throw yield response.json();
                }
                if (reqConfig.auth && !reqConfig.preventRefreshToken && ts) {
                    ts.refreshToken(response);
                }
                let data;
                try {
                    data = (yield response.json());
                }
                catch (_d) {
                    try {
                        data = (yield response.text());
                    }
                    catch (_e) {
                        data = undefined;
                    }
                }
                const httpResponse = Object.assign({ data }, response);
                (_c = reqConfig === null || reqConfig === void 0 ? void 0 : reqConfig.onSuccess) === null || _c === void 0 ? void 0 : _c.call(reqConfig, httpResponse);
                setStates({ isLoading: false, error: null });
            }
            catch (err) {
                if ((error === null || error === void 0 ? void 0 : error.message) === "Failed to fetch") {
                    logoutAction();
                    return;
                }
                setStates({ isLoading: false, error: err });
            }
        }), [isLoading, ...((_a = reqConfig === null || reqConfig === void 0 ? void 0 : reqConfig.dependencies) !== null && _a !== void 0 ? _a : [])]);
        useEffect(() => {
            var _a;
            error && ((_a = reqConfig.applyError) === null || _a === void 0 ? void 0 : _a.call(reqConfig, error));
        }, [error]);
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
