# Informe de Auditoría de Seguridad: Backend & API

**Proyecto:** Culturistas - Plataforma Turística Cochabamba  
**Fecha:** Diciembre 2025  
**Estado de la Auditoría:** ✅ Mitigado / Seguro  
**Versión del Documento:** 1.2 (Actualizado)

---

## 1. Resumen Ejecutivo

Este documento detalla las pruebas de penetración (pentesting) y las medidas de endurecimiento (hardening) aplicadas a los sistemas de autenticación y autorización del backend. El objetivo fue identificar y mitigar vulnerabilidades críticas según el OWASP Top 10, enfocándose en fuerza bruta, inyección de código y control de acceso.

Tras la implementación de controles de seguridad avanzados, el sistema se considera **robusto**, habiendo eliminado vectores críticos que permitían el acceso no autorizado a datos de terceros.

---

## 2. Metodología de Pruebas

Las pruebas se realizaron en un entorno de desarrollo controlado, utilizando las siguientes herramientas y técnicas:

* **Herramientas:** Postman (para manipulación de headers y payloads), cURL, Scripts de prueba personalizados (Go/Bash).
* **Vectores Analizados:**
    1.  Ataques de Fuerza Bruta (Brute Force).
    2.  Ataques de Análisis de Tiempo (Timing Attacks).
    3.  Inyección SQL (SQLi).
    4.  Enumeración de Usuarios.
    5.  **Manipulación de Parámetros e IDOR (Nuevo).**

---

## 3. Hallazgos y Mitigaciones

### 3.1. Protección contra Fuerza Bruta
* **Riesgo:** Un atacante podría intentar adivinar credenciales mediante el envío masivo de peticiones al endpoint `/login`.
* **Mitigación Implementada:** Se integró un middleware de **Rate Limiting** (`login_limiter.go`).
* **Resultado:** El sistema detecta patrones abusivos y bloquea temporalmente las IPs que exceden el umbral de intentos fallidos permitidos.

### 3.2. Prevención de Ataques por Tiempo (Timing Attacks)
* **Riesgo:** La diferencia en el tiempo de respuesta entre un usuario "no encontrado" y una "contraseña incorrecta" permitía deducir correos registrados.
* **Mitigación Implementada:** Estrategia de **Jitter (Retardo Aleatorio)**.
    * *Detalle Técnico:* Uso de `time.Sleep` con `rand.Intn` para normalizar tiempos de respuesta ante errores.
* **Resultado:** Los tiempos son indistinguibles, eliminando la fuga de información por latencia.

### 3.3. Resistencia a Inyección SQL (SQLi)
* **Prueba:** Inyección de payloads maliciosos (ej. `' OR '1'='1`) en campos de login.
* **Defensa:** Uso del ORM **GORM** y consultas parametrizadas.
* **Resultado:** El sistema trata la entrada estrictamente como datos, siendo inmune a inyecciones SQL estándar.

### 3.4. Privacidad en Consultas (Enumeración)
* **Prueba:** Peticiones secuenciales a endpoints para extraer la base de usuarios.
* **Resultado:** El sistema responde con mensajes controlados que no revelan la estructura de la base de datos ni la existencia de IDs específicos de forma explotable.

### 3.5. Prevención de Referencias Directas Inseguras a Objetos (IDOR) [NUEVO]
* **Riesgo Crítico Detectado:** Durante las pruebas manuales exhaustivas con **Postman**, se identificó que un usuario autenticado (Usuario A) podía acceder y manipular los recursos privados (favoritos, intereses) de otro usuario (Usuario B) simplemente cambiando el ID en la URL (ej. cambiar `/users/10/favorites` a `/users/5/favorites`).
* **Mitigación Implementada:** Se implementó una **Validación de Propiedad Estricta** en la capa de controladores.
    * *Lógica:* El sistema verifica `if tokenID != urlID`. Si no coinciden, la petición es rechazada antes de tocar la base de datos.
* **Resultado:**
    * Las pruebas de regresión con Postman confirmaron que el acceso cruzado ahora devuelve un error **403 Forbidden**.
    * **Excepción Administrativa:** Se verificó y validó que únicamente los usuarios con rol de **Administrador** mantienen el permiso para acceder a recursos ajenos con fines de soporte y gestión.

---

## 4. Conclusión

El backend ha superado satisfactoriamente las pruebas de seguridad ofensiva, elevando significativamente su nivel de protección. La arquitectura actual demuestra un manejo competente de:

* **Integridad:** Protección total contra SQL Injection.
* **Disponibilidad:** Prevención de saturación mediante Rate Limiting.
* **Confidencialidad:** Mitigación de Enumeración y Timing Attacks.
* **Autorización:** Control de acceso granular que previene el robo de datos entre usuarios (Anti-IDOR).

Se recomienda mantener esta lógica de validación de propiedad en cualquier nuevo endpoint que involucre datos sensibles de usuario.

---

## 5. Seguridad del Sistema de IA

### 5.1. Validación de Entrada en el Asistente
* **Implementación:** Todos los requests al sistema de IA (`/ia/prompt`, `/ia/vision`, `/ia/itinerary`) se validan con esquemas **Zod** antes de procesarse.
* **Beneficio:** Previene inyección de payloads maliciosos y garantiza tipos de datos correctos.

### 5.2. Aislamiento de Contexto por Usuario
* **Diseño:** La memoria conversacional en ChromaDB está particionada por `userId`. Cada usuario solo accede a su propia historia.
* **Filtrado:** Todas las búsquedas semánticas incluyen `where: { userId }` para garantizar aislamiento.

### 5.3. Proxy de Autenticación
* **Flujo:** El frontend nunca se comunica directamente con el servicio de IA. Todas las peticiones pasan por el backend Go que:
  1. Valida el token JWT
  2. Extrae el `userID` del token (no del request body)
  3. Enriquece el contexto con datos del usuario desde la BD
  4. Reenvía al servicio de IA con datos verificados

### 5.4. Omisión Controlada de Memoria
* **Implementación:** El parámetro `skipMemory` permite omitir operaciones de memoria para requests especiales (como generación de itinerarios).
* **Uso Seguro:** Esto solo afecta el almacenamiento, no la autenticación ni autorización.

---

## 6. Recomendaciones Futuras

1. **Rate Limiting en Endpoints de IA**: Implementar límites de requests por usuario para prevenir abuso del modelo.
2. **Auditoría de Logs**: Mantener logging estructurado (Pino) para análisis forense.
3. **Rotación de JWT Secret**: Implementar rotación periódica del secreto JWT.
4. **Content Security Policy**: Configurar headers CSP en el proxy Caddy.
5. **Sanitización de Prompts**: Revisar prompts del usuario para prevenir prompt injection en el LLM.