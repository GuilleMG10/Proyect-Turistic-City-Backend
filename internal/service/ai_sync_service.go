package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
)

// AIPlacePayload represents a place/event in the format expected by the AI backend
type AIPlacePayload struct {
	Name                  string `json:"name"`
	Description           string `json:"description"`
	Category              string `json:"category"`
	Type                  string `json:"type"` // "lugar" or "evento"
	Atencion              string `json:"atencion"`
	TiempoEstimadoVisita  string `json:"tiempo_estimado_visita"`
	LoMasIconicoDelLugar  string `json:"lo_mas_iconico_del_lugar"`
	EstimatedPrice        string `json:"estimated_price"`
}

// AISyncRequest is the request body for the /ia/places endpoint
type AISyncRequest struct {
	Places []AIPlacePayload `json:"places"`
}

// AISyncService handles syncing places and events to the AI backend (ChromaDB)
type AISyncService struct {
	aiBackendURL string
	httpClient   *http.Client
}

// NewAISyncService creates a new AISyncService
func NewAISyncService() *AISyncService {
	return &AISyncService{
		aiBackendURL: "http://localhost:3500/ia/places",
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// SyncPlaceToAI syncs a single place to the AI backend
func (s *AISyncService) SyncPlaceToAI(place *model.Place) error {
	if place == nil {
		return nil
	}

	payload := AIPlacePayload{
		Name:                 place.Name,
		Description:          place.Description,
		Category:             place.Category,
		Type:                 "lugar",
		Atencion:             "Horario no especificado", // Places don't have this field
		TiempoEstimadoVisita: "1-2 horas",               // Default estimate
		LoMasIconicoDelLugar: "",
		EstimatedPrice:       "Gratis", // Places don't have prices
	}

	return s.syncToAI([]AIPlacePayload{payload})
}

// SyncEventToAI syncs a single event to the AI backend
func (s *AISyncService) SyncEventToAI(event *model.Event) error {
	if event == nil {
		return nil
	}

	// Format the event date for display
	eventDateStr := ""
	if !event.EventDate.IsZero() {
		eventDateStr = event.EventDate.Format("02/01/2006 15:04")
	}

	// Format price
	priceStr := "Gratis"
	if event.Price > 0 {
		priceStr = fmt.Sprintf("%.2f Bs", event.Price)
	}

	// Build attention/schedule info including the event date
	atencion := "Fecha del evento: " + eventDateStr

	payload := AIPlacePayload{
		Name:                 event.Name,
		Description:          event.Description,
		Category:             event.Category,
		Type:                 "evento",
		Atencion:             atencion,
		TiempoEstimadoVisita: "2-3 horas", // Default estimate for events
		LoMasIconicoDelLugar: "",
		EstimatedPrice:       priceStr,
	}

	return s.syncToAI([]AIPlacePayload{payload})
}

// SyncAllPlacesToAI syncs all places to the AI backend
func (s *AISyncService) SyncAllPlacesToAI(places []*model.Place) error {
	if len(places) == 0 {
		return nil
	}

	payloads := make([]AIPlacePayload, 0, len(places))
	for _, place := range places {
		if place == nil || !place.Active {
			continue
		}
		payloads = append(payloads, AIPlacePayload{
			Name:                 place.Name,
			Description:          place.Description,
			Category:             place.Category,
			Type:                 "lugar",
			Atencion:             "Horario no especificado",
			TiempoEstimadoVisita: "1-2 horas",
			LoMasIconicoDelLugar: "",
			EstimatedPrice:       "Gratis",
		})
	}

	return s.syncToAI(payloads)
}

// SyncAllEventsToAI syncs all events to the AI backend
func (s *AISyncService) SyncAllEventsToAI(events []*model.Event) error {
	if len(events) == 0 {
		return nil
	}

	payloads := make([]AIPlacePayload, 0, len(events))
	for _, event := range events {
		if event == nil {
			continue
		}

		eventDateStr := ""
		if !event.EventDate.IsZero() {
			eventDateStr = event.EventDate.Format("02/01/2006 15:04")
		}

		priceStr := "Gratis"
		if event.Price > 0 {
			priceStr = fmt.Sprintf("%.2f Bs", event.Price)
		}

		payloads = append(payloads, AIPlacePayload{
			Name:                 event.Name,
			Description:          event.Description,
			Category:             event.Category,
			Type:                 "evento",
			Atencion:             "Fecha del evento: " + eventDateStr,
			TiempoEstimadoVisita: "2-3 horas",
			LoMasIconicoDelLugar: "",
			EstimatedPrice:       priceStr,
		})
	}

	return s.syncToAI(payloads)
}

// syncToAI sends the payloads to the AI backend
func (s *AISyncService) syncToAI(payloads []AIPlacePayload) error {
	if len(payloads) == 0 {
		return nil
	}

	request := AISyncRequest{Places: payloads}
	jsonData, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal AI sync request: %w", err)
	}

	resp, err := s.httpClient.Post(s.aiBackendURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Warning: Failed to sync to AI backend: %v", err)
		// Don't return error to not block the main operation
		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Warning: AI backend returned status %d", resp.StatusCode)
	} else {
		log.Printf("Successfully synced %d items to AI backend", len(payloads))
	}

	return nil
}
