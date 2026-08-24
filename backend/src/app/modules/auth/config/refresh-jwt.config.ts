import { registerAs } from "@nestjs/config";
import { JwtModuleOptions, JwtSignOptions } from "@nestjs/jwt";
import { parseJwtExpires } from "../../../common/utils/jwt-exp";

export default registerAs(
    'refreshJwt',
    (): JwtSignOptions => ({
        secret: process.env.REFRESH_JWT_SECRET,
        expiresIn: parseJwtExpires(process.env.REFRESH_JWT_EXPIRES_IN, '7d'),
    }),
)