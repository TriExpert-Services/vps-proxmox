# CloudVPS Pro - Docker Deployment Guide

Esta guía te ayudará a desplegar CloudVPS Pro usando Docker de manera completa y profesional.

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker 20.10+
- Docker Compose 2.0+
- Git
- 4GB RAM mínimo
- 20GB espacio libre en disco

### Instalación en Un Solo Comando

```bash
# Clonar el repositorio
git clone https://github.com/your-org/cloudvps-pro.git
cd cloudvps-pro

# Instalar y ejecutar
make install
```

## 📋 Configuración Detallada

### 1. Configuración de Variables de Entorno

```bash
# Copiar archivo de configuración
cp .env.docker .env

# Editar configuración
nano .env
```

**Variables críticas que debes cambiar:**

```env
# Seguridad (OBLIGATORIO cambiar)
DB_PASSWORD=tu-password-super-seguro-aqui
REDIS_PASSWORD=tu-redis-password-aqui
JWT_SECRET=tu-jwt-secret-super-seguro-aqui

# Proxmox (Configurar según tu setup)
PROXMOX_HOST=tu-servidor-proxmox.com
PROXMOX_USERNAME=cloudvps@pve
PROXMOX_PASSWORD=tu-password-proxmox

# Stripe (Para pagos)
STRIPE_PUBLISHABLE_KEY=pk_live_tu-clave-publica
STRIPE_SECRET_KEY=sk_live_tu-clave-secreta
STRIPE_WEBHOOK_SECRET=whsec_tu-webhook-secret

# Email (SendGrid recomendado)
SENDGRID_API_KEY=SG.tu-api-key-sendgrid
FROM_EMAIL=noreply@tu-dominio.com
```

### 2. Despliegue de Servicios

**Arquitectura de servicios incluidos:**

- **App**: Aplicación principal (React + Node.js)
- **PostgreSQL**: Base de datos principal
- **Redis**: Cache y sesiones
- **Nginx**: Proxy reverso y balanceador
- **Backup**: Servicio automatizado de backups

## 🛠️ Comandos de Gestión

### Comandos Básicos

```bash
# Ver todos los comandos disponibles
make help

# Iniciar en producción
make prod

# Iniciar en desarrollo
make dev

# Ver logs en tiempo real
make logs

# Ver estado de servicios
make status

# Parar todos los servicios
make down
```

### Comandos de Mantenimiento

```bash
# Crear backup de la base de datos
make backup

# Restaurar desde backup
make restore BACKUP_FILE=backups/backup_20250115_120000.sql.gz

# Acceder a la consola de la aplicación
make shell

# Acceder a la base de datos
make shell-db

# Actualizar aplicación
make update
```

### Comandos de Desarrollo

```bash
# Iniciar entorno de desarrollo
make dev

# Ejecutar tests
make test

# Construir imágenes
make build-dev

# Ver logs de desarrollo
docker-compose -f docker-compose.dev.yml logs -f
```

## 🏗️ Arquitectura Docker

### Estructura de Contenedores

```
┌─────────────────┐    ┌─────────────────┐
│      Nginx      │────│   Application   │
│   (Port 80/443) │    │   (Port 3000)   │
└─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         │              │   PostgreSQL    │
         │              │   (Port 5432)   │
         │              └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         └──────────────│      Redis      │
                        │   (Port 6379)   │
                        └─────────────────┘
```

### Volúmenes Persistentes

- `postgres_data`: Datos de PostgreSQL
- `redis_data`: Datos de Redis
- `app_logs`: Logs de la aplicación
- `nginx_logs`: Logs de Nginx
- `./backups`: Backups de base de datos
- `./uploads`: Archivos subidos por usuarios

### Red Docker

- Red interna: `172.20.0.0/16`
- Comunicación entre servicios por nombre de servicio
- Exposición externa solo a través de Nginx

## 🔒 Seguridad

### Configuración de Seguridad Implementada

1. **Contenedores no-root**: Todos los servicios corren con usuarios limitados
2. **Rate limiting**: Configurado en Nginx para prevenir ataques
3. **Headers de seguridad**: HSTS, CSP, X-Frame-Options, etc.
4. **Secrets management**: Variables sensibles en archivos .env
5. **Network isolation**: Red Docker privada

### SSL/HTTPS Setup

```bash
# Generar certificados SSL (requiere dominio público)
make ssl

# Configurar certificados manualmente
mkdir -p docker/nginx/ssl
# Copiar certificados a docker/nginx/ssl/
# - fullchain.pem
# - privkey.pem
```

## 📊 Monitoreo y Logging

### Ver Métricas de Recursos

```bash
# Uso de recursos en tiempo real
make monitoring

# Health check de servicios
make health

# Logs específicos por servicio
make logs-app    # Solo aplicación
make logs-db     # Solo base de datos
```

### Estructura de Logs

```
logs/
├── app/
│   ├── access.log
│   ├── error.log
│   └── application.log
├── nginx/
│   ├── access.log
│   └── error.log
└── postgres/
    └── postgresql.log
```

## 🔄 Backup y Restauración

### Backup Automático

Los backups se ejecutan automáticamente cada día a las 2:00 AM:

```bash
# Backup manual
make backup

# Listar backups
ls -la backups/

# Configurar retención (editar crontab del servicio backup)
docker-compose exec backup crontab -e
```

### Restauración de Datos

```bash
# Restaurar base de datos
make restore BACKUP_FILE=backups/cloudvps_db_20250115_020000.sql.gz

# Restaurar volúmenes completos
docker-compose down -v
# Restaurar volúmenes desde backup externo
docker-compose up -d
```

## 🚀 Despliegue en Producción

### Configuración para Producción

1. **Preparar servidor:**
```bash
# Instalar Docker y Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo pip3 install docker-compose
```

2. **Configurar dominio y DNS:**
```bash
# Apuntar dominio a IP del servidor
# A record: yourdomain.com -> YOUR_SERVER_IP
# CNAME: www.yourdomain.com -> yourdomain.com
```

3. **Configurar SSL:**
```bash
# Usando Let's Encrypt
make ssl
# Introducir tu dominio cuando se solicite
```

4. **Iniciar en producción:**
```bash
# Configurar .env para producción
nano .env

# Iniciar servicios
make prod

# Verificar que todo funcione
make health
```

### Configuración de Proxy Reverso (Nginx)

Para múltiples dominios o subdominios:

```bash
# Editar configuración de Nginx
nano docker/nginx/conf.d/default.conf

# Agregar configuraciones adicionales
nano docker/nginx/conf.d/admin.conf  # Para subdominio admin
nano docker/nginx/conf.d/api.conf    # Para API independiente
```

## 🔧 Troubleshooting

### Problemas Comunes

1. **Contenedores no inician:**
```bash
# Ver logs detallados
docker-compose logs

# Verificar recursos del sistema
df -h
free -m

# Reiniciar Docker daemon
sudo systemctl restart docker
```

2. **Base de datos no conecta:**
```bash
# Verificar estado de PostgreSQL
docker-compose exec postgres pg_isready -U cloudvps

# Resetear base de datos
docker-compose down
docker volume rm cloudvps_postgres_data
docker-compose up -d
```

3. **Aplicación no responde:**
```bash
# Verificar logs de la aplicación
make logs-app

# Reiniciar solo la aplicación
docker-compose restart app

# Verificar conectividad de red
docker-compose exec app ping postgres
docker-compose exec app ping redis
```

4. **Problemas de permisos:**
```bash
# Verificar permisos de archivos
ls -la uploads/ logs/

# Corregir permisos
sudo chown -R $USER:$USER uploads/ logs/
chmod -R 755 uploads/ logs/
```

### Comandos de Diagnóstico

```bash
# Estado completo del sistema
docker system info
docker system df

# Procesos en contenedores
docker-compose top

# Uso de recursos por contenedor
docker stats

# Inspeccionar configuración
docker-compose config

# Verificar conectividad de red
docker network ls
docker network inspect cloudvps_cloudvps_network
```

## 📈 Optimización de Rendimiento

### Configuración para Alto Tráfico

```bash
# Editar docker-compose.yml para aumentar recursos
nano docker-compose.yml

# Ejemplo de configuración optimizada:
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2'
        reservations:
          memory: 1G
          cpus: '1'
    
  postgres:
    command: |
      postgres
      -c shared_buffers=256MB
      -c max_connections=100
      -c effective_cache_size=1GB
```

### Escalado Horizontal

```bash
# Escalar aplicación (múltiples instancias)
docker-compose up -d --scale app=3

# Load balancing automático vía Nginx
# (configurado automáticamente)
```

## 🧪 Testing

### Tests Automatizados

```bash
# Ejecutar suite de tests completa
make test

# Tests de integración
docker-compose -f docker-compose.dev.yml run --rm app npm run test:integration

# Tests de carga
docker-compose -f docker-compose.dev.yml run --rm app npm run test:load
```

### Validación de Despliegue

```bash
# Script de validación post-despliegue
./scripts/validate-deployment.sh

# Verificar endpoints críticos
curl -f http://localhost/health
curl -f http://localhost/api/health
curl -f http://localhost/api/v1/plans
```

## 📚 Referencias Adicionales

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [PostgreSQL Docker Guide](https://hub.docker.com/_/postgres)

Para más información detallada, consulta:
- `docs/INSTALLATION.md` - Instalación completa paso a paso
- `docs/API.md` - Documentación de la API
- `docs/DEPLOYMENT.md` - Despliegue tradicional (sin Docker)

---

**¡Tu plataforma CloudVPS Pro está lista para ejecutarse en Docker! 🎉**