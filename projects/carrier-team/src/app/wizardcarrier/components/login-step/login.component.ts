import { Component, OnInit } from '@angular/core';
import { Auth, signInWithEmailAndPassword, User } from '@angular/fire/auth';
import { Database, get, ref } from '@angular/fire/database';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styles: [],
})
export class LoginComponent implements OnInit {
  email = ''; // Stores the user's email
  currentUser = '';
  password = ''; // Stores the user's password
  user: User | null = null; // Stores the logged-in user
  isAdmin = false; // Checks if the user is an admin
  wrongPassword = false; // Flag for incorrect password
  noAdminAccess = false; // Flag for non-admin access
  LoggedIn = false;

  constructor(private db: Database, private auth: Auth) {}

  ngOnInit() {
    // Check if user data is stored in localStorage
    const storedUser = localStorage.getItem('user');
    const storedAdmin = localStorage.getItem('isAdmin');

    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.isAdmin = storedAdmin === 'true';
      this.LoggedIn = true;
      this.currentUser = this.formatEmailToName('Welcome' + ' ' + this.user.email);
    }
  }

  /**
   * Method to handle user login
   */
  onLogin() {
    this.resetErrors(); // Reset error flags

    signInWithEmailAndPassword(this.auth, this.email, this.password)
      .then(userCredential => {
        this.user = userCredential.user;
        this.checkAdminStatus(this.user); // Check admin status
      })
      .catch(error => {
        console.error('Error signing in:', error);
        this.wrongPassword = true; // Show error for incorrect password
      });
  }

  /**
   * Method to handle user logout
   */
  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userRole');

    this.user = null;
    this.isAdmin = false;
    location.reload(); // Reload page after logout
  }

  /**
   * Checks if the logged-in user is an admin
   * @param user - Logged-in user
   */
  checkAdminStatus(user: User) {
    const adminRef = ref(this.db, `admins/${user.uid}`);
    const membersRef = ref(this.db, `members`);

    get(adminRef)
      .then(snapshot => {
        // Kontrollera om användaren är admin
        this.isAdmin = snapshot.exists() && snapshot.val() === true;

        // Spara användarens adminstatus i localStorage
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isAdmin', JSON.stringify(this.isAdmin));

        // Om användaren är admin
        if (this.isAdmin) {
          console.log('User is admin');
          localStorage.setItem('userRole', 'admin'); // Spara manager-rollen i localStorage

          location.reload(); // Ladda om för admin-åtkomst
          return;
        }

        // Kontrollera om användaren finns i "members" för manager-åtkomst
        get(membersRef)
          .then(membersSnapshot => {
            if (membersSnapshot.exists()) {
              const members = Object.values(membersSnapshot.val()) as Array<any>;
              const isManager = members.some(member => member.email.toLowerCase() === user.email.toLowerCase());

              if (isManager) {
                console.log('User is manager');
                localStorage.setItem('userRole', 'manager'); // Spara manager-rollen i localStorage
                location.reload(); // Ladda om för manager-åtkomst
              } else {
                console.warn('User does not have manager access');
                this.noAdminAccess = true; // Visa meddelande för otillräcklig åtkomst
                location.reload(); // Ladda om för att logga ut
              }
            }
          })
          .catch(error => {
            console.error('Error checking members:', error);
          });
      })
      .catch(error => {
        console.error('Error checking admin status:', error);
      });
  }

  /**
   * Resets error flags
   */
  resetErrors() {
    this.wrongPassword = false;
    this.noAdminAccess = false;
  }

  formatEmailToName(email: string): string {
    return email
      .split('@')[0] // Dela upp e-posten på "@" och ta bara den första delen
      .replace(/\./g, ' ') // Ta bort alla punkter
      .split(' ') // Dela upp på mellanrum
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Gör första bokstaven stor
      .join(' '); // Slå ihop tillbaka till en sträng
  }
}
