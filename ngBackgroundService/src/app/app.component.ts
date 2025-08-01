import { AccountService } from './services/account.service';
import { Component } from '@angular/core';

// On doit commencer par ajouter signalr dans les node_modules: npm install @microsoft/signalr
// Ensuite on inclut la librairie
import * as signalR from "@microsoft/signalr"

interface RoundResult {
  winners: string[],
  nbClicks: number
}

interface GameInfo {
  multiplierCost: number,
  nbWins: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ngBackgroundService';

  baseUrl = "http://localhost:5080/";

  // Ajouter une variable nbWins

  private hubConnection?: signalR.HubConnection

  isConnected = false;
  nbClicks = 0;
  nbWins = 0;
  multiplier = 1
  multiplierCost = 10
  // TODO: Ajouter 3 variables: Le multiplier, le multiplierCost, mais également le multiplierIntialCost pour remettre à jour multiplierCost après chaque fin de round (ou sinon on peut passer l'information dans l'appel qui vient du Hub!)

  constructor(public account: AccountService) {
  }

  Increment() {
    //TODO: Augmenter le nbClicks par la valeur du multiplicateur
    this.nbClicks += this.multiplier;
    this.hubConnection!.invoke('Increment')
  }

  BuyMultiplier() {
    // TODO: Implémenter la méthode qui permet d'acheter un niveau de multiplier (Appel au Hub!)
    if (this.nbClicks >= this.multiplierCost) {
      this.nbClicks -= this.multiplierCost
      this.multiplier *= 2
      this.multiplierCost = this.multiplier * 10
      this.hubConnection!.invoke('BuyMultiplier')
    }
  }

  async register() {
    try {
      await this.account.register();
    }
    catch (e) {
      alert("Erreur pendant l'enregistrement!!!!!");
      return;
    }
    alert("L'enregistrement a été un succès!");
  }

  async login() {
    await this.account.login();
  }

  async logout() {
    await this.account.logout();

    if (this.hubConnection?.state == signalR.HubConnectionState.Connected)
      this.hubConnection.stop();
    this.isConnected = false;
  }

  isLoggedIn(): Boolean {
    return this.account.isLoggedIn();
  }

  connectToHub() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.baseUrl + 'game', { accessTokenFactory: () => sessionStorage.getItem("token")! })
      .build();

    if (!this.hubConnection) {
      console.log("Impossible de créer un HubConnection???");
      return;
    }

    this.hubConnection.on('GameInfo', (data: GameInfo) => {
      this.isConnected = true;
      // TODO: Mettre à jour les variables pour le coût du multiplier et le nbWins
      this.nbWins = data.nbWins
      this.multiplierCost = data.multiplierCost
    });

    this.hubConnection.on('EndRound', (data: RoundResult) => {
      this.nbClicks = 0;
      // TODO: Reset du multiplierCost et le multiplier
      this.multiplierCost = 10
      this.multiplier = 1
      // TODO: Si le joueur a gagné, on augmene nbWins
      if (data.winners.includes(this.account.username)) {
        this.nbWins++
      }

      if (data.nbClicks > 0) {
        let phrase = " a gagné avec ";
        if (data.winners.length > 1)
          phrase = " ont gagnées avec "
        alert(data.winners.join(", ") + phrase + data.nbClicks + " clicks!");
      }
      else {
        alert("Aucun gagnant...");
      }
    });

    this.hubConnection
      .start()
      .then(() => {
        console.log("Connecté au Hub");
      })
      .catch(err => console.log('Error while starting connection: ' + err))
  }
}
