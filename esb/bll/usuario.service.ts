/**
 * ESB - BLL - Servicio de Usuarios
 * Lógica de negocio para gestión de usuarios
 */

import { usuarioRepository } from '../dal';
import type { Usuario } from '../models/entities';
import { ESBLogger } from '../utils/soap-utils';

const logger = ESBLogger.getInstance();

export class UsuarioService {
  async obtenerUsuarios(): Promise<Usuario[]> {
    logger.info('Obteniendo todos los usuarios');
    return usuarioRepository.findAll();
  }

  async obtenerUsuarioPorId(idUsuario: string): Promise<Usuario> {
    logger.info(`Obteniendo usuario con ID: ${idUsuario}`);
    const usuario = await usuarioRepository.findById(idUsuario);
    if (!usuario) {
      throw new Error(`Usuario con ID ${idUsuario} no encontrado`);
    }
    return usuario;
  }

  async crearUsuario(usuario: Usuario): Promise<Usuario> {
    logger.info('Creando nuevo usuario', { email: usuario.email });
    
    // Validaciones
    if (!usuario.email || !this.validarEmail(usuario.email)) {
      throw new Error('Email inválido');
    }

    // Verificar que el email no exista
    const existente = await usuarioRepository.findByEmail(usuario.email);
    if (existente) {
      throw new Error(`El email ${usuario.email} ya está registrado`);
    }

    const nuevoUsuario: Usuario = {
      ...usuario,
      fechaRegistro: new Date(),
      activo: true
    };

    return usuarioRepository.create(nuevoUsuario);
  }

  async actualizarUsuario(idUsuario: string, usuario: Partial<Usuario>): Promise<Usuario> {
    logger.info(`Actualizando usuario ${idUsuario}`);
    
    const existente = await usuarioRepository.findById(idUsuario);
    if (!existente) {
      throw new Error(`Usuario con ID ${idUsuario} no encontrado`);
    }

    // Si se está actualizando el email, verificar que no exista
    if (usuario.email && usuario.email !== existente.email) {
      const conMismoEmail = await usuarioRepository.findByEmail(usuario.email);
      if (conMismoEmail) {
        throw new Error(`El email ${usuario.email} ya está en uso`);
      }
    }

    return usuarioRepository.update(idUsuario, usuario);
  }

  async eliminarUsuario(idUsuario: string): Promise<boolean> {
    logger.info(`Eliminando usuario ${idUsuario}`);
    
    const usuario = await usuarioRepository.findById(idUsuario);
    if (!usuario) {
      throw new Error(`Usuario con ID ${idUsuario} no encontrado`);
    }

    // Desactivar en lugar de eliminar (soft delete)
    await usuarioRepository.update(idUsuario, { activo: false });
    return true;
  }

  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
}

export const usuarioService = new UsuarioService();
