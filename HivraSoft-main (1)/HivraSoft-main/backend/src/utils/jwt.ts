import jwt, {
  SignOptions,
  JwtPayload,
} from "jsonwebtoken";

export type AuthTokenPayload = JwtPayload & {
  id: string;
  role: string;
};

export const generateToken = (
  userId: string,
  role: string
): string => {
  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET missing in .env"
    );
  }

  const expiresIn =
    (
      process.env.JWT_EXPIRES_IN ||
      "1y"
    ) as SignOptions["expiresIn"];

  return jwt.sign(
    {
      id: userId,
      role,
    },
    secret,
    {
      expiresIn,
    }
  );
};

export const verifyToken = (
  token: string
): AuthTokenPayload => {
  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET missing in .env"
    );
  }

  return jwt.verify(
    token,
    secret
  ) as AuthTokenPayload;
};