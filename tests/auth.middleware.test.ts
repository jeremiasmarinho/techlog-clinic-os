import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../src/middleware/auth.middleware';

// Mock jwt
jest.mock('jsonwebtoken');

describe('authMiddleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        mockRequest = {
            headers: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        nextFunction = jest.fn();

        // Set JWT_SECRET for tests
        process.env.JWT_SECRET = 'test-secret-key';
    });

    describe('Token Validation', () => {
        it('should return 401 when no authorization header is provided', () => {
            authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token não fornecido' });
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it('should return 401 when authorization header is empty', () => {
            mockRequest.headers = { authorization: '' };

            authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token não fornecido' });
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it('should return 401 when token is invalid', () => {
            mockRequest.headers = { authorization: 'Bearer invalid-token' };
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error('invalid token');
            });

            authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token inválido' });
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it('should return 401 when token is expired', () => {
            mockRequest.headers = { authorization: 'Bearer expired-token' };
            (jwt.verify as jest.Mock).mockImplementation(() => {
                const error: any = new Error('jwt expired');
                error.name = 'TokenExpiredError';
                throw error;
            });

            authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token inválido' });
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it('should return 401 when token signature is invalid', () => {
            mockRequest.headers = { authorization: 'Bearer malformed-token' };
            (jwt.verify as jest.Mock).mockImplementation(() => {
                const error: any = new Error('invalid signature');
                error.name = 'JsonWebTokenError';
                throw error;
            });

            authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token inválido' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });

    describe('Successful Authentication', () => {
        it('should call next() when token is valid', () => {
            const decodedToken = { userId: 1, clinicId: 1, role: 'admin' };
            mockRequest.headers = { authorization: 'Bearer valid-token' };
            (jwt.verify as jest.Mock).mockReturnValue(decodedToken);

            authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
            expect((mockRequest as any).user).toEqual(decodedToken);
        });

        it('should attach user data to request object', () => {
            const decodedToken = {
                userId: 42,
                clinicId: 5,
                role: 'doctor',
                name: 'Dr. Test',
            };
            mockRequest.headers = { authorization: 'Bearer valid-token' };
            (jwt.verify as jest.Mock).mockReturnValue(decodedToken);

            authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

            expect((mockRequest as any).user).toEqual(decodedToken);
            expect((mockRequest as any).user.userId).toBe(42);
            expect((mockRequest as any).user.clinicId).toBe(5);
            expect((mockRequest as any).user.role).toBe('doctor');
        });

        it('should use JWT_SECRET from environment', () => {
            mockRequest.headers = { authorization: 'Bearer test-token' };
            (jwt.verify as jest.Mock).mockReturnValue({ userId: 1 });

            authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(jwt.verify).toHaveBeenCalledWith('test-token', 'test-secret-key');
        });
    });

    describe('Token Format', () => {
        it('should extract token from "Bearer <token>" format', () => {
            mockRequest.headers = { authorization: 'Bearer my-actual-token' };
            (jwt.verify as jest.Mock).mockReturnValue({ userId: 1 });

            authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(jwt.verify).toHaveBeenCalledWith('my-actual-token', expect.any(String));
        });

        it('should handle token without Bearer prefix', () => {
            mockRequest.headers = { authorization: 'just-a-token' };
            // When split(' ') is called on 'just-a-token', destructuring gives undefined for token
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error('jwt malformed');
            });

            authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

            // The middleware will try to verify undefined, which should fail
            expect(mockResponse.status).toHaveBeenCalledWith(401);
        });

        it('should handle authorization header with multiple spaces', () => {
            mockRequest.headers = { authorization: 'Bearer   token-with-spaces' };
            (jwt.verify as jest.Mock).mockReturnValue({ userId: 1 });

            authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

            // Token extraction uses split(' ')[1], so extra spaces become the token
            expect(jwt.verify).toHaveBeenCalled();
        });
    });

    describe('Security Edge Cases', () => {
        it('should not leak token information in error response', () => {
            mockRequest.headers = { authorization: 'Bearer secret-token-123' };
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error('invalid token');
            });

            authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

            // Error message should be generic, not exposing the token
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token inválido' });
            const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
            expect(JSON.stringify(jsonCall)).not.toContain('secret-token-123');
        });

        it('should handle undefined JWT_SECRET gracefully', () => {
            const originalSecret = process.env.JWT_SECRET;
            delete process.env.JWT_SECRET;

            mockRequest.headers = { authorization: 'Bearer any-token' };
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error('secretOrPublicKey must have a value');
            });

            authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);

            // Restore
            process.env.JWT_SECRET = originalSecret;
        });
    });
});
