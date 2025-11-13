/**
 * Test de almacenamiento de Usuarios (RAM → luego DB)
 * - Crea 2 usuarios
 * - Lista e imprime
 * - Elimina 1
 * - Muestra conteo y usuarios restantes
 */

import type { Usuario } from './models/entities';
import { usuarioRepository } from './dal/usuario.repository';

function getDataBackend(): 'memory' | 'pg' {
  const v = (process.env.DATA_BACKEND || 'memory').toLowerCase();
  return v === 'pg' ? 'pg' : 'memory';
}

async function testUsuarios() {
  console.log('👤=====================================');
  console.log('   TEST: Repositorio de Usuarios (DAL)');
  console.log('=====================================\n');

  console.log('Ejecutando en: ', getDataBackend() == 'memory' ? 'RAM' : 'Base de datos PostgreSQL');

  // 1) Crear dos usuarios
  const u1: Omit<Usuario, 'idUsuario' | 'fechaRegistro'> = {
    nombre: 'Juliana',
    apellido: 'Pérez',
    email: 'juliana.perez@example.com',
    telefono: '+593991234567',
    activo: true
  };

  const u2: Omit<Usuario, 'idUsuario' | 'fechaRegistro'> = {
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@example.com',
    telefono: '+593981112223',
    activo: true
  };

  const creado1 = await usuarioRepository.create(u1 as Usuario);
  const creado2 = await usuarioRepository.create(u2 as Usuario);

  // 2) Leer e imprimir sus datos
  const todosAntes = await usuarioRepository.findAll();
  console.log('=== Usuarios luego de crear dos ===');
  console.table(
    todosAntes.map(u => ({
      id: u.idUsuario,
      nombre: `${u.nombre} ${u.apellido}`,
      email: u.email,
      telefono: u.telefono ?? '',
      activo: u.activo,
      fechaRegistro: u.fechaRegistro ? new Date(u.fechaRegistro).toISOString() : ''
    }))
  );

  // 3) Eliminar uno de ellos
  if (!creado1.idUsuario) throw new Error('No se asignó idUsuario al primer usuario');
  const eliminado = await usuarioRepository.delete(creado1.idUsuario);
  console.log(`\n¿Eliminado usuario ${creado1.idUsuario}?`, eliminado ? 'Sí' : 'No');

  // 4) Conteo actual y usuarios restantes
  const conteo = await usuarioRepository.count?.() ?? (await usuarioRepository.findAll()).length;
  const todosDespues = await usuarioRepository.findAll();

  console.log('\nConteo actual de usuarios:', conteo);
  console.log('Usuarios restantes:');
  console.table(
    todosDespues.map(u => ({
      id: u.idUsuario,
      nombre: `${u.nombre} ${u.apellido}`,
      email: u.email
    }))
  );

  // (Opcional) Demostración de helpers del repo:
  const porEmail = await usuarioRepository.findByEmail('juan.perez@example.com');
  console.log('\nBúsqueda por email (juan.perez@example.com):', porEmail ? 'Encontrado' : 'No encontrado');

  const activos = await usuarioRepository.findActivos();
  console.log('Usuarios activos:', activos.length);
}

// Ejecutar test
testUsuarios().catch(err => {
  console.error('\n❌ Error durante la prueba:');
  console.error(err?.message || err);
  if (err?.stack) console.error(err.stack);
  process.exit(1);
});
