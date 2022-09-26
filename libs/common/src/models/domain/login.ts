import { IDecryptable } from "@bitwarden/common/interfaces/IDecryptable";
import { encString, decryptable } from "@bitwarden/common/misc/decryptable.decorator";

import { LoginData } from "../data/loginData";
import { LoginView } from "../view/loginView";

import Domain from "./domainBase";
import { EncString } from "./encString";
import { LoginUri } from "./loginUri";
import { SymmetricCryptoKey } from "./symmetricCryptoKey";

export class Login extends Domain implements IDecryptable<LoginView> {
  @decryptable uris: LoginUri[];
  @encString username: EncString;
  @encString password: EncString;
  passwordRevisionDate?: Date;
  @encString totp: EncString;
  autofillOnPageLoad: boolean;

  constructor(obj?: LoginData) {
    super();
    if (obj == null) {
      return;
    }

    this.passwordRevisionDate =
      obj.passwordRevisionDate != null ? new Date(obj.passwordRevisionDate) : null;
    this.autofillOnPageLoad = obj.autofillOnPageLoad;
    this.buildDomainModel(
      this,
      obj,
      {
        username: null,
        password: null,
        totp: null,
      },
      []
    );

    if (obj.uris) {
      this.uris = [];
      obj.uris.forEach((u) => {
        this.uris.push(new LoginUri(u));
      });
    }
  }

  async decrypt(orgId: string, encKey?: SymmetricCryptoKey): Promise<LoginView> {
    const view = await this.decryptObj(
      new LoginView(this),
      {
        username: null,
        password: null,
        totp: null,
      },
      orgId,
      encKey
    );

    if (this.uris != null) {
      view.uris = [];
      for (let i = 0; i < this.uris.length; i++) {
        const uri = await this.uris[i].decrypt(orgId, encKey);
        view.uris.push(uri);
      }
    }

    return view;
  }

  toLoginData(): LoginData {
    const l = new LoginData();
    l.passwordRevisionDate =
      this.passwordRevisionDate != null ? this.passwordRevisionDate.toISOString() : null;
    l.autofillOnPageLoad = this.autofillOnPageLoad;
    this.buildDataModel(this, l, {
      username: null,
      password: null,
      totp: null,
    });

    if (this.uris != null && this.uris.length > 0) {
      l.uris = [];
      this.uris.forEach((u) => {
        l.uris.push(u.toLoginUriData());
      });
    }

    return l;
  }

  toView() {
    const view = new LoginView();

    // Unencrypted properties
    view.autofillOnPageLoad = this.autofillOnPageLoad;
    view.passwordRevisionDate = this.passwordRevisionDate;

    // Encrypted properties
    view.username = this.username.decryptedValue;
    view.password = this.password.decryptedValue;
    view.totp = this.totp.decryptedValue;

    return view;
  }
}
