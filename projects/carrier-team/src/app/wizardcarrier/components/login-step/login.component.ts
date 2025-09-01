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
    localStorage.clear(); // Tar bort ALLT i localStorage
    this.user = null;
    this.isAdmin = false;
    location.reload(); // Laddar om sidan för att tillämpa ändringar
  }

  /**
   * Checks if the logged-in user is an admin
   * @param user - Logged-in user
   */
  /**
   * Checks if the logged-in user is an admin, manager, or developer.
   * @param user - Logged-in user
   */
  checkAdminStatus(user: User) {
    const adminRef = ref(this.db, `admins/${user.uid}`);
    const membersRef = ref(this.db, `members`);
    const developersRef = ref(this.db, `developers`);

    get(adminRef)
      .then(snapshot => {
        this.isAdmin = snapshot.exists() && snapshot.val() === true;

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isAdmin', JSON.stringify(this.isAdmin));

        if (this.isAdmin) {
          console.log('User is admin');
          localStorage.setItem('userRole', 'admin');
          location.reload();
          return;
        }

        // Kontrollera om användaren finns i "developers" för utvecklar-åtkomst
        get(developersRef)
          .then(devSnapshot => {
            if (devSnapshot.exists()) {
              const developers = Object.values(devSnapshot.val()) as Array<any>;
              const isDeveloper = developers.some(dev => dev.email.toLowerCase() === user.email.toLowerCase());

              if (isDeveloper) {
                console.log('User is developer');
                localStorage.setItem('userRole', 'developer');
                location.reload();
                return;
              }
            }

            // Kontrollera om användaren finns i "members" för manager-åtkomst
            get(membersRef)
              .then(membersSnapshot => {
                if (membersSnapshot.exists()) {
                  const members = Object.values(membersSnapshot.val()) as Array<any>;
                  const isManager = members.some(member => member.email.toLowerCase() === user.email.toLowerCase());

                  if (isManager) {
                    console.log('User is manager');
                    localStorage.setItem('userRole', 'manager');
                    location.reload();
                  } else {
                    console.warn('User does not have admin, developer, or manager access');
                    this.noAdminAccess = true;
                    location.reload();
                  }
                }
              })
              .catch(error => {
                console.error('Error checking members:', error);
              });
          })
          .catch(error => {
            console.error('Error checking developers:', error);
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
