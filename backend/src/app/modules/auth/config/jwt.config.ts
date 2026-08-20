import { registerAs } from "@nestjs/config";
import { JwtModuleOptions } from "@nestjs/jwt";
import { parseJwtExpires } from "../../../common/utils/jwt-exp";

export default registerAs(
    'jwt',
    (): JwtModuleOptions => ({
        secret: process.env.JWT_SECRET,
        signOptions: {
            expiresIn: parseJwtExpires(process.env.JWT_EXPIRES_IN), // config.expiresIn// 
        },
    }),
)