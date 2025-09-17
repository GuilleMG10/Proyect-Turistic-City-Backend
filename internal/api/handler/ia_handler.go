package handler

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

type IAHandler struct{}

func NewIAHandler() *IAHandler {
	return &IAHandler{}
}

func (h *IAHandler) GenerateAIResponse(c *gin.Context) {
	var requestBody struct {
		Prompt string `json:"prompt"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El campo 'prompt' es obligatorio"})
		return
	}

	if requestBody.Prompt == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El campo 'prompt' no puede estar vacío"})
		return
	}

	nodeBackendURL := "http://localhost:3000/ia/prompt"

	payload, err := json.Marshal(map[string]string{"prompt": requestBody.Prompt})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear el cuerpo de la petición"})
		return
	}

	// Crea la petición HTTP
	req, err := http.NewRequest("POST", nodeBackendURL, bytes.NewBuffer(payload))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear la petición a Node.js"})
		return
	}
	req.Header.Set("Content-Type", "application/json")

	// Ejecuta la petición
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al conectar con el backend de IA"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		c.JSON(resp.StatusCode, gin.H{"error": fmt.Sprintf("Error del backend de Node.js: %s", string(bodyBytes))})
		return
	}

	// Configura los headers para Server-Sent Events
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Transfer-Encoding", "chunked")

	// Lee la respuesta de Node.js en streaming y la retransmite al cliente
	reader := bufio.NewReader(resp.Body)
	for {
		line, err := reader.ReadBytes('\n')
		if err != nil {
			if err == io.EOF {
				break
			}
			fmt.Printf("Error al leer del stream: %v\n", err)
			break
		}

		c.Writer.Write(line)
		c.Writer.Flush()
	}
}
