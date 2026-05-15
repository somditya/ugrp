import {
  signAccessToken as _signAccessToken,
  signRefreshToken as _signRefreshToken,
  signTokenPair as _signTokenPair,
  verifyAccessToken as _verifyAccessToken,
  verifyRefreshToken as _verifyRefreshToken,
  isTokenBlocked as _isTokenBlocked,
  blocklistToken as _blocklistToken,
  storeRefreshTokenHash as _storeRefreshTokenHash,
  getStoredRefreshHash as _getStoredRefreshHash,
  revokeRefreshTokenHash as _revokeRefreshTokenHash,
  hashToken as _hashToken,
} from '@services/authService';

export const JWT_ACCESS_EXPIRATION = '8h';
export const JWT_REFRESH_EXPIRATION = '7d';

export const signAccessToken = _signAccessToken;
export const signRefreshToken = _signRefreshToken;
export const signTokenPair = _signTokenPair;
export const verifyAccessToken = _verifyAccessToken;
export const verifyRefreshToken = _verifyRefreshToken;
export const isTokenBlocked = _isTokenBlocked;
export const blocklistToken = _blocklistToken;
export const storeRefreshTokenHash = _storeRefreshTokenHash;
export const getStoredRefreshHash = _getStoredRefreshHash;
export const revokeRefreshTokenHash = _revokeRefreshTokenHash;
export const hashToken = _hashToken;