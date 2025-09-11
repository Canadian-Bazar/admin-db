import express from 'express'
import trimRequest from 'trim-request'

import * as authControllers from '../controllers/auth.controller.js'
import * as authValidators from '../validators/auth.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(trimRequest.all)

router.post(
  '/signup',
  authValidators.signupValidator,
  authControllers.signupController,
)

router.post(
  '/login',
  authValidators.loginValidator,
  authControllers.loginController
)

router.delete(
  '/logout',
  authControllers.logoutController
)

router.post(
  '/send-otp',
  authValidators.sendOtpvalidator,
  authControllers.sendOtpController
)

router.post(
  '/forgot-password-token',
  authValidators.generateForgotPasswordTokenValidator,
  authControllers.generateForgotPasswordTokenController
)

router.post(
  '/reset-password',
  authValidators.resetPasswordValidator,
  authControllers.resetPasswordController
)

router.post(
  '/verify-otp',
  authValidators.verifyOtpValidator,
  authControllers.verifyOtpController
)

router.get(
  '/verify-tokens',
  authValidators.verifyTokensValidator,
  authControllers.verifyTokensController
)

router.get(
  '/verify-token',
  requireAuth,
  authControllers.verifyTokenController
)

router.get(
  '/user-permissions',
  requireAuth,
  authControllers.getUserPermissionsController
)

router.get(
  '/my-permissions',
  requireAuth,
  authControllers.getCurrentUserPermissionsController
)

export default router
