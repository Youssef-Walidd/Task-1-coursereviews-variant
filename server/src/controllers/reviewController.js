import { Review } from '../models/Review.js';

// TODO: write a validation schema for create/update per README.md section 2.

import Joi from 'joi';
import mongoose from 'mongoose';


const createValidationSchema = Joi.object({
  courseCode: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().allow(''),
  reviewedby: Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }, 'ObjectId Validation').optional()  
});

const updateValidationSchema = Joi.object({
  courseCode: Joi.string().optional(),
  rating: Joi.number().integer().min(1).max(5).optional(),
  comment: Joi.string().allow('').optional(),
  reviewedby: Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    } return value;
  }, 'ObjectId Validation').optional(),
}).min(1); // Ensure at least one field is provided for update

// GET /api/reviews
// TODO: implement per README.md section 3.
export async function getAllReviews(req, res, next) {
  try {
    // TODO
    const filter = {};
    if (req.query.courseCode) {
      filter.courseCode = req.query.courseCode.toUpperCase();
    }

    const reviews = await Review.find(filter).populate('reviewedby', 'name email');
    res.status(200).json(reviews);
  } catch (err) { next(err); }
}

// GET /api/reviews/:id
// TODO: implement per README.md sections 3 and 5.
export async function getReview(req, res, next) {
  try {
    // TODO
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }
    const review = await Review.findById(id).populate('reviewedby', 'name email');
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.status(200).json(review);
  } catch (err) { next(err); }
}

// GET /api/reviews/summary?courseCode=CS101
// TODO: implement per README.md section 4.
export async function getCourseSummary(req, res, next) {
  try {
    // TODO
    const { courseCode } = req.query;
    if (!courseCode) {
      return res.status(400).json({ error: 'courseCode query parameter is required' });
    }

    const formattedCode = courseCode.toUpperCase();
    const summary = await Review.aggregate([
      { $match: { courseCode: formattedCode } },
      {
        $group: {
          _id: '$courseCode',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      },
      { $project: {
        _id: 0,
        courseCode: '$_id',
        averageRating: { $round: ['$averageRating', 1] },
        reviewCount: 1
        }
      }
    ]);

    if (summary.length === 0) {
      return res.status(200).json({ courseCode: formattedCode, averageRating: 0, reviewCount: 0 });
    }

    res.status(200).json(summary);
  } catch (err) { next(err); }
}

// POST /api/reviews
// TODO: implement per README.md section 3.
export async function createReview(req, res, next) {
  try {
    // TODO
    const { error, value } = createValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const review = await Review.create(value);
    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'You have already reviewed this course.' });
    }
    next(err);
  }
}

// PATCH /api/reviews/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateReview(req, res, next) {
  try {
    // TODO
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }
    const { error, value } = updateValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const review = await Review.findByIdAndUpdate(id, value, { new: true });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.status(200).json(review);
  } catch (err) {
    
    if (err.code === 11000) {
      return res.status(400).json({ error: 'You have already reviewed this course.' });
    }
    next(err); 
  }
}

// DELETE /api/reviews/:id
// TODO: implement per README.md sections 3 and 5.
export async function deleteReview(req, res, next) {
  try {
    // TODO

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }
    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.status(200).json({ message: 'Review deleted successfully' });

  } catch (err) { next(err); }
}
