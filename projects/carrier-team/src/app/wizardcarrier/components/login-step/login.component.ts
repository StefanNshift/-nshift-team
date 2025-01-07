import { Component, OnInit } from '@angular/core';
import { Database, ref, get } from '@angular/fire/database';
import { Auth, signInWithEmailAndPassword, User } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styles: [],
})
export class LoginComponent implements OnInit {
  email: string = '';                // Stores the user's email
  password: string = '';             // Stores the user's password
  user: User | null = null;          // Stores the logged-in user
  isAdmin: boolean = false;          // Checks if the user is an admin
  wrongPassword: boolean = false;    // Flag for incorrect password
  noAdminAccess: boolean = false;    // Flag for non-admin access

  constructor(private db: Database, private auth: Auth) {}

  ngOnInit() {
    // Check if user data is stored in localStorage
    const storedUser = localStorage.getItem('user');
    const storedAdmin = localStorage.getItem('isAdmin');

    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.isAdmin = storedAdmin === 'true';
      console.log(this.user);
    }
  }

  /**
   * Method to handle user login
   */
  onLogin() {
    this.resetErrors(); // Reset error flags

    signInWithEmailAndPassword(this.auth, this.email, this.password)
      .then((userCredential) => {
        this.user = userCredential.user;
        this.checkAdminStatus(this.user); // Check admin status
      })
      .catch((error) => {
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

    get(adminRef)
      .then((snapshot) => {
        // Check if user is an admin
        this.isAdmin = snapshot.exists() && snapshot.val() === true;

        // Save user data in localStorage
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isAdmin', JSON.stringify(this.isAdmin));

        if (this.isAdmin) {
          location.reload(); // Reload for admin access
        } else {
          this.noAdminAccess = true; // Show message for non-admin access
          location.reload(); // Reload page after logout

        }
      })
      .catch((error) => {
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
}
