package service

import (
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
)

type ReviewRepository interface {
	FindByPlaceID(placeID uint) ([]*model.Review, error)
}

type ReviewService struct {
	reviewRepository ReviewRepository
}

func NewReviewService(reviewRepository ReviewRepository) *ReviewService {
	return &ReviewService{reviewRepository: reviewRepository}
}

func (s *ReviewService) GetReviewsForPlace(placeID uint) ([]*model.Review, error) {
	return s.reviewRepository.FindByPlaceID(placeID)
}
