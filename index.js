"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authBuilder = exports.httpProviderBuilder = void 0;
const react_1 = __importStar(require("react"));
/* #region Constants */
const CONTENT_TYPE = "Content-Type";
const APPLICATION_JSON = "application/json";
/* #endregion */
/* #region default params */
const defaultCreateHttp = {
    baseUrl: "",
    defaultApplyError: (error) => { },
    // dispatchHook: useDispatch<Dispatch<AnyAction>>,
    logoutAction: () => { },
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
function httpProviderBuilder(createHttpParams = defaultCreateHttp) {
    createHttpParams = Object.assign(Object.assign({}, defaultRequestConfig), createHttpParams);
    const { baseUrl, defaultApplyError, tokenServices: ts, logoutAction, } = createHttpParams;
    return (reqConfig) => {
        var _a;
        if (!reqConfig.applyError)
            reqConfig.applyError = defaultApplyError;
        reqConfig = Object.assign(Object.assign({}, defaultRequestParams), reqConfig);
        // const [isLoading, setIsLoading] = useState<boolean>(false);
        // const [error, setError] = useState<any>(null);
        const [states, setStates] = (0, react_1.useState)({
            isLoading: false,
            error: null,
        });
        const { isLoading, error } = states;
        const request = (0, react_1.useCallback)((params = defaultRequestParams) => __awaiter(this, void 0, void 0, function* () {
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
                Object.entries(params.query)
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
        return {
            request,
            isLoading,
            error,
        };
    };
}
exports.httpProviderBuilder = httpProviderBuilder;
function authBuilder(tokenServices) {
    const AuthContext = (0, react_1.createContext)({
        user: null,
        login(userInfo) { },
        logout() { },
    });
    const AuthProvider = function ({ children }) {
        const [user, setUser] = (0, react_1.useState)(null);
        function login(userInfo) {
            tokenServices.setToken(userInfo.token);
            setUser(userInfo);
        }
        function logout() {
            tokenServices.removeToken();
            setUser(null);
        }
        return react_1.default.createElement(AuthContext.Provider, {
            value: { user, login, logout },
            children,
        });
    };
    const useAuthStore = () => (0, react_1.useContext)(AuthContext);
    return {
        AuthProvider,
        useAuthStore,
    };
}
exports.authBuilder = authBuilder;
