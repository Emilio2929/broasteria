import { estadoempleadomodel } from "./estadoempleadomodel";
import { rolmodel } from "./rolmodel";

export interface empleadomodel{
    idEmpleado?: number;
    nombre?: string;
    apellido?: string;
    rol?: rolmodel | null;
    usuarioLogin?: string;
    contrasenaHash?: string;
    estado?: estadoempleadomodel | null;
    online?: number;
}
