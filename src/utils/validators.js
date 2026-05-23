export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return "Email is required";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Enter a valid email address";
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password) {
    return "Password is required";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }
  return null;
};

export const validateRequired = (value, message) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return message;
  }
  return null;
};
