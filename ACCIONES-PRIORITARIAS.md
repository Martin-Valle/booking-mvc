# 🚨 ACCIONES PRIORITARIAS - APIs CON PROBLEMAS

## ⚡ URGENTE - Resolver HOY

### 1. 🔴 Autos RentCar - Error de Base de Datos

**Estado**: ❌ HTTP 500 - Login failed for user 'db30420'  
**Tiempo estimado**: 2-4 horas  
**Impacto**: CRÍTICO - Servicio completamente inoperativo

#### Diagnóstico
```sql
System.Data.SqlClient.SqlException: Login failed for user 'db30420'
Location: AccesoDatos.Repos.AutosRepo.Buscar(FiltrosAutos f)
```

#### Plan de Acción
- [ ] **Paso 1**: Revisar archivo `web.config` o `appsettings.json`
  ```xml
  <connectionStrings>
    <add name="DefaultConnection" 
         connectionString="Server=...;Database=...;User Id=db30420;Password=???" />
  </connectionStrings>
  ```

- [ ] **Paso 2**: Validar credenciales con el DBA
  - Usuario: `db30420`
  - ¿Contraseña correcta?
  - ¿Usuario activo?

- [ ] **Paso 3**: Verificar permisos en SQL Server
  ```sql
  -- Ejecutar en SQL Server
  USE RentCarDB;
  GRANT SELECT, INSERT, UPDATE ON dbo.Autos TO db30420;
  ```

- [ ] **Paso 4**: Probar conexión manualmente
  ```bash
  sqlcmd -S server.database.windows.net -U db30420 -P password -d RentCarDB
  ```

- [ ] **Paso 5**: Reiniciar el servicio web después del fix

#### Contacto
- **Responsable**: DBA / Equipo Backend
- **Servidor**: Azure - rentaautosmadrid-eqcqaecdaxfthmca.canadacentral-01.azurewebsites.net

---

### 2. 🔴 Real Cuenca Hotel - Bug de Código

**Estado**: ❌ HTTP 500 - DataReader not closed  
**Tiempo estimado**: 4-6 horas  
**Impacto**: CRÍTICO - Servicio completamente inoperativo

#### Diagnóstico
```
There is already an open DataReader associated with this Command 
which must be closed first.
Error location: GDatos.BuscarServicios
```

#### Plan de Acción

- [ ] **Paso 1**: Localizar archivo `GDatos.cs` o `GDatos.BuscarServicios`

- [ ] **Paso 2**: Identificar código problemático
  ```csharp
  // ❌ CÓDIGO INCORRECTO (actual)
  SqlCommand cmd = new SqlCommand(query, connection);
  SqlDataReader reader = cmd.ExecuteReader();
  while (reader.Read()) {
      // procesar...
  }
  // ⚠️ DataReader nunca se cierra!
  ```

- [ ] **Paso 3**: Implementar fix con `using` statements
  ```csharp
  // ✅ CÓDIGO CORRECTO
  using (SqlConnection connection = new SqlConnection(connectionString))
  using (SqlCommand cmd = new SqlCommand(query, connection))
  {
      connection.Open();
      using (SqlDataReader reader = cmd.ExecuteReader())
      {
          while (reader.Read())
          {
              // procesar datos...
          }
      } // DataReader se cierra automáticamente aquí
  } // Command y Connection se cierran aquí
  ```

- [ ] **Paso 4**: Revisar TODOS los métodos que usan DataReader
  - `BuscarServicios()`
  - `ObtenerDetalle()`
  - `VerificarDisponibilidad()`
  - Cualquier otro que use `SqlDataReader`

- [ ] **Paso 5**: Agregar manejo de errores
  ```csharp
  try 
  {
      using (SqlDataReader reader = cmd.ExecuteReader())
      {
          // código...
      }
  }
  catch (Exception ex)
  {
      logger.Error("Error en BuscarServicios", ex);
      throw;
  }
  ```

- [ ] **Paso 6**: Probar localmente antes de deploy

- [ ] **Paso 7**: Deploy a Azure y verificar

#### Contacto
- **Responsable**: Desarrollador Real Cuenca Hotel
- **Repositorio**: Solicitar acceso al código fuente
- **Servidor**: Azure - realdecuencaintegracion-abachrhfgzcrb0af.canadacentral-01.azurewebsites.net

---

## ⚠️ IMPORTANTE - Resolver ESTA SEMANA

### 3. 🟡 Backend Cuenca - Gateway Error

**Estado**: ❌ HTTP 502 - Bad Gateway  
**Tiempo estimado**: Variable (depende del proveedor)  
**Impacto**: ALTO - Servicio inaccesible

#### Diagnóstico
```
Error HTTP 502: Bad Gateway
El servidor proxy no puede contactar el backend
```

#### Plan de Acción

- [ ] **Paso 1**: Verificar si el servicio está activo
  ```powershell
  # Probar con curl
  curl http://backendcuenca.runasp.net/WSIntegracion.asmx?WSDL
  ```

- [ ] **Paso 2**: Revisar panel de runasp.net
  - Login: https://runasp.net
  - Verificar status del servicio
  - Revisar logs del servidor

- [ ] **Paso 3**: Contactar soporte de runasp.net
  - Email: support@runasp.net
  - Ticket: "Backend Cuenca service returning 502"
  - Include: Timestamp, endpoint, error details

- [ ] **Paso 4**: Implementar health check
  ```csharp
  // Agregar endpoint de health check
  [WebMethod]
  public string HealthCheck() {
      return "OK";
  }
  ```

- [ ] **Paso 5**: Configurar monitoreo
  - Usar UptimeRobot o similar
  - Alerta si servicio cae
  - Intervalo: cada 5 minutos

#### Contacto
- **Responsable**: DevOps / Proveedor
- **Proveedor**: runasp.net
- **Support**: support@runasp.net

---

### 4. 🟡 Hotel Boutique - Error Interno

**Estado**: ❌ HTTP 500 - Internal Server Error  
**Tiempo estimado**: 6-8 horas  
**Impacto**: ALTO - Servicio inaccesible

#### Diagnóstico
```
HTTP 500: The page cannot be displayed because an 
internal server error has occurred.
No details available
```

#### Plan de Acción

- [ ] **Paso 1**: Habilitar logging detallado
  ```xml
  <!-- En web.config -->
  <system.web>
    <customErrors mode="Off"/>
    <trace enabled="true"/>
  </system.web>
  ```

- [ ] **Paso 2**: Solicitar logs al proveedor
  - Contactar runasp.net
  - Request: Event Viewer logs
  - Período: Últimas 24 horas

- [ ] **Paso 3**: Implementar error handling global
  ```csharp
  public class GlobalErrorHandler : SoapExtension
  {
      public override void ProcessMessage(SoapMessage message)
      {
          try {
              // procesar...
          } catch (Exception ex) {
              Logger.Error("SOAP Error", ex);
              throw new SoapException(
                  "Error processing request", 
                  SoapException.ServerFaultCode, 
                  ex
              );
          }
      }
  }
  ```

- [ ] **Paso 4**: Agregar try-catch en todos los WebMethods
  ```csharp
  [WebMethod]
  public List<Hotel> BuscarServicios(string ciudad)
  {
      try {
          // lógica del servicio
      }
      catch (Exception ex) {
          Logger.Error($"Error en BuscarServicios: {ex.Message}", ex);
          throw new SoapException(
              "Error buscando servicios", 
              SoapException.ServerFaultCode,
              ex
          );
      }
  }
  ```

- [ ] **Paso 5**: Deploy y monitorear

#### Contacto
- **Responsable**: Desarrollador Hotel Boutique
- **Proveedor**: runasp.net
- **Servidor**: hotelboutique.runasp.net

---

## 🔵 OPTIMIZACIÓN - Resolver ESTE MES

### 5. 🟢 Cafeteria París - Performance

**Estado**: ✅ OK pero lento (3390ms)  
**Tiempo estimado**: 2-3 días  
**Impacto**: MEDIO - Experiencia de usuario pobre

#### Objetivo
- **Actual**: 3390ms
- **Objetivo**: < 2000ms
- **Reducción requerida**: 41%

#### Plan de Acción

- [ ] **Paso 1**: Profile del código
  ```csharp
  Stopwatch sw = Stopwatch.StartNew();
  // operación 1
  Console.WriteLine($"Op1: {sw.ElapsedMilliseconds}ms");
  sw.Restart();
  // operación 2
  Console.WriteLine($"Op2: {sw.ElapsedMilliseconds}ms");
  ```

- [ ] **Paso 2**: Analizar queries de BD
  ```sql
  -- Activar SQL Profiler
  -- Buscar queries > 500ms
  -- Agregar índices donde sea necesario
  CREATE INDEX IX_Cafeteria_Ciudad ON Cafeteria(Ciudad);
  ```

- [ ] **Paso 3**: Implementar caché
  ```csharp
  private static Dictionary<string, CachedResult> _cache = 
      new Dictionary<string, CachedResult>();
  
  public List<Servicio> BuscarServicios(string filtro)
  {
      string cacheKey = $"search_{filtro}";
      if (_cache.ContainsKey(cacheKey) && 
          !_cache[cacheKey].IsExpired(TimeSpan.FromMinutes(5)))
      {
          return _cache[cacheKey].Data;
      }
      
      var result = // llamada a BD...
      _cache[cacheKey] = new CachedResult { Data = result };
      return result;
  }
  ```

- [ ] **Paso 4**: Optimizar serialización XML
  - Usar XmlSerializer en lugar de manual
  - Reducir cantidad de datos retornados
  - Paginar resultados

- [ ] **Paso 5**: Considerar upgrade en Azure
  - Plan actual: ?
  - Plan recomendado: Basic/Standard
  - Cost-benefit analysis

#### Contacto
- **Responsable**: Equipo Performance
- **Servidor**: Azure - cafeteriaparis-c4d5ghhbfqe2fkfs.canadacentral-01.azurewebsites.net

---

### 6. 🟢 Easy Car - Performance

**Estado**: ✅ OK pero lento (3394ms)  
**Tiempo estimado**: 1-2 días  
**Impacto**: MEDIO - Experiencia de usuario pobre

#### Objetivo
- **Actual**: 3394ms
- **Objetivo**: < 2000ms
- **Reducción requerida**: 41%

#### Plan de Acción

- [ ] **Paso 1**: Identificar bottleneck
  - ¿Base de datos?
  - ¿Serialización XML?
  - ¿Red?

- [ ] **Paso 2**: Optimizar queries
  ```sql
  -- Buscar queries lentas
  SELECT TOP 10 
      query_text,
      execution_count,
      total_elapsed_time / 1000000.0 AS total_seconds
  FROM sys.dm_exec_query_stats
  ORDER BY total_elapsed_time DESC
  ```

- [ ] **Paso 3**: Agregar índices
  ```sql
  CREATE INDEX IX_Vehiculos_Categoria 
  ON Vehiculos(Categoria, Disponible);
  ```

- [ ] **Paso 4**: Implementar proyección
  ```csharp
  // En lugar de retornar todo el vehículo
  var vehiculos = db.Vehiculos
      .Select(v => new VehiculoDTO {
          Id = v.Id,
          Modelo = v.Modelo,
          Precio = v.PrecioTarifa
          // Solo campos necesarios
      })
      .ToList();
  ```

- [ ] **Paso 5**: Monitorear mejoras

#### Contacto
- **Responsable**: Desarrollador Easy Car
- **Servidor**: easycar.runasp.net

---

## 📋 CHECKLIST DE SEGUIMIENTO

### Diario
- [ ] Verificar servicios críticos (Easy Car, Restaurant GH, Sky Andes)
- [ ] Revisar si Backend Cuenca volvió online
- [ ] Monitorear logs de errores

### Esta Semana
- [ ] Fix Autos RentCar (DB credentials)
- [ ] Fix Real Cuenca (DataReader bug)
- [ ] Contactar proveedores sobre servicios caídos
- [ ] Implementar health checks

### Este Mes
- [ ] Optimizar Cafeteria París
- [ ] Optimizar Easy Car
- [ ] Implementar circuit breaker
- [ ] Setup monitoreo 24/7

---

## 📞 CONTACTOS DE EMERGENCIA

| Servicio | Contacto | Teléfono | Email |
|----------|----------|----------|-------|
| runasp.net Support | Support Team | - | support@runasp.net |
| Azure Support | Microsoft | - | azure-support |
| DBA | Database Admin | - | dba@company.com |
| DevOps | Ops Team | - | devops@company.com |

---

**Última actualización**: 27 de Octubre, 2025  
**Próxima revisión**: 3 de Noviembre, 2025  
**Ejecutar pruebas**: `npx tsx esb/test-all-apis.ts`
