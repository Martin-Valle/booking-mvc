/**
 * ESB - DAL - Repositorio de Usuarios
 */

import { BaseRepository } from './base.repository';
import type { Usuario } from '../models/entities';

export class UsuarioRepository extends BaseRepository<Usuario> {
  constructor() {
    super(
      'idUsuario',
      'usuario',
      ['idUsuario','nombre','apellido','email','telefono','fechaRegistro','activo']
    );
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const usuarios = await this.findByField('email', email);
    return usuarios[0] ?? null;
  }

  async findActivos(): Promise<Usuario[]> {
    return this.findByField('activo', true as any);
  }
}

export const usuarioRepository = new UsuarioRepository();
