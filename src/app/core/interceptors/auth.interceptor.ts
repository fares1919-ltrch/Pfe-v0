import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { TokenStorageService } from "../services/token-storage.service";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const token = tokenStorage.getToken();

  // Debug request details
  console.debug(`[Auth Interceptor] Request to: ${req.url}`, {
    hasToken: !!token,
    method: req.method
  });

  if (token) {
    // Ensure token is properly formatted - remove Bearer prefix if present before adding it
    // This prevents "Bearer Bearer xxx" issues
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    const formattedToken = `Bearer ${cleanToken}`;

    console.log('Adding auth header with token:', formattedToken.substring(0, 20) + '...');

    const authReq = req.clone({
      headers: req.headers.set('Authorization', formattedToken),
      // Don't override withCredentials if already set
      withCredentials: req.withCredentials === true ? true : req.withCredentials
    });

    console.debug(`[Auth Interceptor] Headers after adding token:`,
      Array.from(authReq.headers.keys()).map(key => `${key}: ${authReq.headers.getAll(key)}`));

    return next(authReq);
  } else {
    console.warn(' No token available for request to:', req.url);
  }

  return next(req);
};
