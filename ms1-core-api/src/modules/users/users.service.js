// users.service.js — business logic for the users module.
//
// Responsibility: All rules about creating and managing employee accounts.
//
// Rules enforced here:
//   - Email must be unique across all users
//   - Password is hashed before storing (never stored in plain text)
//   - User deactivation is a soft delete (isActive = false), not a hard delete
//   - Admin cannot deactivate themselves
//   - If password is updated, it is re-hashed

const bcrypt = require('bcryptjs');

const usersRepository = require('./users.repository');
const AppError = require('../../utils/AppError');

const BCRYPT_SALT_ROUNDS = 10;

// Get all users
const getAllUsers = async () => {
  return usersRepository.findAllUsers();
};

// Get a single user — throws 404 if not found
const getUserById = async (id) => {
  const user = await usersRepository.findUserById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

// Create a new employee account
const createUser = async (userData) => {
  const { name, email, password, phone, role } = userData;

  // Rule: Email must be unique
  const existingUser = await usersRepository.findUserByEmail(email);
  if (existingUser) {
    throw new AppError('A user with this email already exists', 409);
  }

  // Hash the password before storing
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const newUser = await usersRepository.createUser({
    name,
    email,
    phone:        phone || null,
    passwordHash: passwordHash,
    role,
    isActive:     true,
  });

  return newUser;
};

// Update an existing user's details
const updateUser = async (id, updateData, requestingUserId) => {
  // Rule: Confirm the user being updated actually exists
  const existingUser = await usersRepository.findUserById(id);
  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  // Rule: Admin cannot deactivate their own account
  if (
    updateData.isActive === false &&
    id === requestingUserId
  ) {
    throw new AppError('You cannot deactivate your own account', 400);
  }

  // Rule: If email is being changed, check it isn't already taken by another active user
  if (updateData.email) {
    const emailTaken = await usersRepository.findUserByEmail(updateData.email);
    if (emailTaken && emailTaken.id !== id) {
      throw new AppError('A user with this email already exists', 409);
    }
  }

  // Rule: If password is being updated, hash it before storing
  if (updateData.password) {
    updateData.passwordHash = await bcrypt.hash(updateData.password, BCRYPT_SALT_ROUNDS);
    delete updateData.password; // never store plain text
  }

  const updatedUser = await usersRepository.updateUser(id, updateData);
  return updatedUser;
};

// Delete (deactivate) a user
const deleteUser = async (id, requestingUserId) => {
  // Rule: Confirm the user being deleted actually exists
  const existingUser = await usersRepository.findUserById(id);
  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  // Rule: Cannot delete your own account
  if (id === requestingUserId) {
    throw new AppError('You cannot delete your own account', 400);
  }

  // Soft delete by setting isActive to false and modifying email to free it up
  // Append _deleted_timestamp to email to allow email reuse while preserving data
  const deletedEmail = `${existingUser.email}_deleted_${Date.now()}`;
  await usersRepository.updateUser(id, { isActive: false, email: deletedEmail });
  return { message: 'User deleted successfully' };
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
