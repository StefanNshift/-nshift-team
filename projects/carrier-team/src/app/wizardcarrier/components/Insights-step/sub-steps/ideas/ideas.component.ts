import { Component, OnInit } from '@angular/core';
import { Database, ref, push, get, update, remove } from '@angular/fire/database';
import { Auth, User } from '@angular/fire/auth';

interface Idea {
  key?: string;
  title: string;
  description: string;
  votes: number;
  createdBy: string; // User UID
  createdByName: string; // User Name
  voters?: string[]; // Array med användare som har röstat
}

@Component({
  selector: 'app-ideas',
  templateUrl: './ideas.component.html',
  styleUrls: ['./ideas.component.scss'],
})
export class IdeasComponent implements OnInit {
  ideas: Idea[] = [];
  newIdeaTitle = '';
  newIdeaDescription = '';
  user: User | null = null;
  isAdmin = false; // Flagga för adminstatus
  isLoading = true;
  username: string;

  constructor(private db: Database, private auth: Auth) {}

  ngOnInit() {
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.user = user;
        this.checkAdminStatus(user);
        this.retrieveIdeas();
        console.log(this.user.email);
        this.username = this.formatEmailToName(this.user.email);
        console.log(this.username);
      }
    });
  }

  formatEmailToName(email: string): string {
    return email
      .split('@')[0] // Dela upp e-posten på "@" och ta bara den första delen
      .replace(/\./g, ' ') // Ta bort alla punkter
      .split(' ') // Dela upp på mellanrum
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Gör första bokstaven stor
      .join(' '); // Slå ihop tillbaka till en sträng
  }

  // Kolla om användaren är admin
  checkAdminStatus(user: User) {
    const adminRef = ref(this.db, `admins/${user.uid}`);
    get(adminRef).then(snapshot => {
      if (snapshot.exists()) {
        this.isAdmin = true;
      }
    });
  }

  // Hämta alla idéer från Firebase
  // Hämta alla idéer från Firebase
  retrieveIdeas() {
    const ideasRef = ref(this.db, 'ideas');

    get(ideasRef).then(snapshot => {
      if (snapshot.exists()) {
        this.ideas = Object.entries(snapshot.val()).map(([key, value]: [string, any]) => ({
          key,
          ...(typeof value === 'object' ? value : {}),
          voters: value.voters ? value.voters : [], // Se till att voters alltid är en array
        }));
      }
      this.isLoading = false;
    });
  }

  // Lägg till en ny idé i Firebase
  addIdea() {
    if (!this.newIdeaTitle.trim() || !this.newIdeaDescription.trim() || !this.user) {
      return;
    }

    const newIdea: Idea = {
      title: this.newIdeaTitle.trim(),
      description: this.newIdeaDescription.trim(),
      votes: 0,
      createdBy: this.user.uid,
      createdByName: this.username || 'Anonym',
    };

    const ideasRef = ref(this.db, 'ideas');
    push(ideasRef, newIdea)
      .then(() => {
        this.newIdeaTitle = '';
        this.newIdeaDescription = '';
        this.retrieveIdeas();
      })
      .catch(error => console.error('Error adding idea:', error));
  }

  // Rösta på en idé
  // Rösta på en idé
  // Rösta på en idé
  voteIdea(idea: Idea) {
    if (!idea.key || !this.user) return;

    // Förhindra skaparen från att rösta
    if (idea.createdBy === this.user.uid) {
      alert("You can't vote for your own idea!");
      return;
    }

    const ideaRef = ref(this.db, `ideas/${idea.key}`);
    const votersRef = ref(this.db, `ideas/${idea.key}/voters`);

    get(votersRef).then(snapshot => {
      let voters: string[] = snapshot.exists() ? snapshot.val() : [];

      if (!Array.isArray(voters)) {
        voters = []; // Säkerställ att det är en array
      }

      if (voters.includes(this.user!.uid)) {
        alert('You have already voted for this idea! 🚀');
        return;
      }

      // Uppdatera röster och lägg till användaren i `voters`
      update(ideaRef, {
        votes: idea.votes + 1,
        voters: [...voters, this.user!.uid], // Lägg till användaren i listan
      })
        .then(() => {
          this.retrieveIdeas();
        })
        .catch(error => console.error('Error voting:', error));
    });
  }

  // Ta bort en idé (Endast admin eller skaparen kan ta bort)
  deleteIdea(idea: Idea) {
    if (!idea.key || !this.user) return;

    if (this.isAdmin || idea.createdBy === this.user.uid) {
      const ideaRef = ref(this.db, `ideas/${idea.key}`);
      remove(ideaRef)
        .then(() => {
          this.retrieveIdeas();
        })
        .catch(error => console.error('Error deleting idea:', error));
    }
  }
}
