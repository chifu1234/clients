import { CryptoService } from "../../abstractions/crypto.service";
import { StateService } from "../../abstractions/state.service";
import { TokenService } from "../../abstractions/token.service";
import { VaultTimeoutSettingsService as VaultTimeoutSettingsServiceAbstraction } from "../../abstractions/vaultTimeout/vaultTimeoutSettings.service";

export class VaultTimeoutSettingsService implements VaultTimeoutSettingsServiceAbstraction {
  constructor(
    private cryptoService: CryptoService,
    private tokenService: TokenService,
    private stateService: StateService
  ) {}

  async setVaultTimeoutOptions(timeout: number, action: string): Promise<void> {
    await this.stateService.setVaultTimeout(timeout);

    // We swap these tokens from being on disk for lock actions, and in memory for logout actions
    // Get them here to set them to their new location after changing the timeout action and clearing if needed
    const token = await this.tokenService.getToken();
    const refreshToken = await this.tokenService.getRefreshToken();
    const clientId = await this.tokenService.getClientId();
    const clientSecret = await this.tokenService.getClientSecret();

    const currentAction = await this.stateService.getVaultTimeoutAction();
    if ((timeout != null || timeout === 0) && action === "logOut" && action !== currentAction) {
      // if we have a vault timeout and the action is log out, reset tokens
      await this.tokenService.clearToken();
    }

    await this.stateService.setVaultTimeoutAction(action);

    await this.tokenService.setToken(token);
    await this.tokenService.setRefreshToken(refreshToken);
    await this.tokenService.setClientId(clientId);
    await this.tokenService.setClientSecret(clientSecret);

    await this.cryptoService.toggleKey();
  }

  async isPinLockSet(): Promise<[boolean, boolean]> {
    const protectedPin = await this.stateService.getProtectedPin();
    const pinProtectedKey = await this.stateService.getEncryptedPinProtected();
    return [protectedPin != null, pinProtectedKey != null];
  }

  async isBiometricLockSet(): Promise<boolean> {
    return await this.stateService.getBiometricUnlock();
  }

  async getVaultTimeout(userId?: string): Promise<number> {
    return await this.stateService.getVaultTimeout({ userId: userId });
  }

  async setVaultTimeout(timeout: number, userId?: string): Promise<void> {
    await this.stateService.setVaultTimeout(timeout, { userId: userId });
  }

  async clear(userId?: string): Promise<void> {
    await this.stateService.setEverBeenUnlocked(false, { userId: userId });
    await this.stateService.setDecryptedPinProtected(null, { userId: userId });
    await this.stateService.setProtectedPin(null, { userId: userId });
  }
}
