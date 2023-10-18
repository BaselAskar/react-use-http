import React from "react";
export interface HttpBuilder {
    baseUrl: string;
    defaultApplyError: (error: any) => void;
    tokenServices?: {
        getToken: () => string | null;
        refreshToken: (response: Response) => void;
    };
    logoutAction: () => void;
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
export declare function httpProviderBuilder(createHttpParams?: HttpBuilder): <TResult = any>(reqConfig: RequestConfig<TResult>) => void;
export declare function authBuilder<TUser extends {
    token: string;
}>(): {
    AuthProvider: (setToken: (token: string) => void, removeToken: () => void) => React.FunctionComponentElement<React.ProviderProps<AuthType<TUser>>>;
    useAuthStore: () => AuthType<TUser>;
};
export {};
//# sourceMappingURL=index.d.ts.map