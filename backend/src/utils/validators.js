/**
 * Validation utility functions
 */

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Indian format)
const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Validate URL
const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// Validate budget range
const isValidBudget = (min, max) => {
  return (
    typeof min === "number" && typeof max === "number" && min > 0 && max >= min
  );
};

// Validate array of skills
const isValidSkillsArray = (skills) => {
  return (
    Array.isArray(skills) &&
    skills.length > 0 &&
    skills.every(
      (skill) => typeof skill === "string" && skill.trim().length > 0
    )
  );
};

// Validate date (not in the past)
const isValidFutureDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  return date > now;
};

// Validate password strength
const isStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

// Validate project title
const isValidTitle = (title) => {
  return (
    typeof title === "string" &&
    title.trim().length >= 10 &&
    title.trim().length <= 200
  );
};

// Validate description
const isValidDescription = (description) => {
  return (
    typeof description === "string" &&
    description.trim().length >= 50 &&
    description.trim().length <= 5000
  );
};

// Validate location
const isValidLocation = (location) => {
  return (
    typeof location === "string" &&
    location.trim().length >= 2 &&
    location.trim().length <= 100
  );
};

// Validate experience level
const isValidExperienceLevel = (level) => {
  const validLevels = ["beginner", "intermediate", "expert"];
  return validLevels.includes(level);
};

// Validate project status
const isValidProjectStatus = (status) => {
  const validStatuses = ["open", "in-progress", "completed", "cancelled"];
  return validStatuses.includes(status);
};

// Validate proposal status
const isValidProposalStatus = (status) => {
  const validStatuses = ["pending", "accepted", "rejected", "withdrawn"];
  return validStatuses.includes(status);
};

// Sanitize string (remove HTML tags and trim)
const sanitizeString = (str) => {
  return str
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .trim();
};

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidURL,
  isValidBudget,
  isValidSkillsArray,
  isValidFutureDate,
  isStrongPassword,
  isValidTitle,
  isValidDescription,
  isValidLocation,
  isValidExperienceLevel,
  isValidProjectStatus,
  isValidProposalStatus,
  sanitizeString,
  isValidObjectId,
};
