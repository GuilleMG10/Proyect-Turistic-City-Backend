package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// IPRateLimiter controla los límites por IP
type IPRateLimiter struct {
	ips map[string]*rate.Limiter
	mu  *sync.RWMutex
	r   rate.Limit
	b   int
}

// NewIPRateLimiter crea un limitador (r = peticiones por segundo, b = ráfaga permitida)
// Ejemplo: r=1/60 (1 cada 60 seg), b=5 (máximo 5 intentos seguidos)
func NewIPRateLimiter(r rate.Limit, b int) *IPRateLimiter {
	i := &IPRateLimiter{
		ips: make(map[string]*rate.Limiter),
		mu:  &sync.RWMutex{},
		r:   r,
		b:   b,
	}

	// Rutina de limpieza para no saturar la memoria con IPs viejas
	go func() {
		for {
			time.Sleep(10 * time.Minute)
			i.mu.Lock()
			for ip, limiter := range i.ips {
				// Si el limitador está "lleno" (tokens restaurados), podemos borrar la IP del mapa
				if limiter.Burst() == int(limitersTokens(limiter)) {
					delete(i.ips, ip)
				}
			}
			i.mu.Unlock()
		}
	}()

	return i
}

func limitersTokens(l *rate.Limiter) float64 {
	return l.Tokens()
}

// AddIP crea un limitador para una IP si no existe
func (i *IPRateLimiter) AddIP(ip string) *rate.Limiter {
	i.mu.Lock()
	defer i.mu.Unlock()

	limiter, exists := i.ips[ip]
	if !exists {
		limiter = rate.NewLimiter(i.r, i.b)
		i.ips[ip] = limiter
	}

	return limiter
}

// GetLimiter obtiene el limitador de una IP
func (i *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
	i.mu.Lock()
	limiter, exists := i.ips[ip]
	i.mu.Unlock()

	if !exists {
		return i.AddIP(ip)
	}

	return limiter
}

// LoginRateLimiter es el Middleware de Gin
func LoginRateLimiter() gin.HandlerFunc {
	// CONFIGURACIÓN DE SEGURIDAD:
	// rate.Every(1 * time.Minute): Se recarga 1 token cada minuto
	// 5: Permite una ráfaga inicial de 5 intentos.
	// Resultado: El usuario tiene 5 intentos. Si falla los 5, debe esperar.
	limiter := NewIPRateLimiter(rate.Every(1*time.Minute), 5)

	return func(c *gin.Context) {
		ip := c.ClientIP()
		l := limiter.GetLimiter(ip)

		if !l.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Demasiados intentos de inicio de sesión. Por favor espera unos minutos.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}