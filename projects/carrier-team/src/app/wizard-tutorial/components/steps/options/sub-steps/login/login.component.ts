import { Component, OnInit } from '@angular/core';
import { Database, ref, get } from '@angular/fire/database';
import { Auth, signInWithEmailAndPassword, User } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styles: [],
})
export class LoginComponent implements OnInit {
  constructor(private db: Database, private auth: Auth) {}

  email: string = '';
  password: string = '';
  user: User | null = null;
  isAdmin: boolean = false;
  wrongpassword: boolean = false;
  noAdminAccess: boolean = false; // New flag for non-admin access

  ngOnInit() {
    const storedUser = localStorage.getItem('user');
    const storedAdmin = localStorage.getItem('isAdmin');

    if (storedUser && storedAdmin) {
      this.user = JSON.parse(storedUser);
      this.isAdmin = JSON.parse(storedAdmin) === true;
    }
  }

  onLogin() {
    this.wrongpassword = false;
    this.noAdminAccess = false; // Reset flag for each login attempt

    signInWithEmailAndPassword(this.auth, this.email, this.password)
      .then((userCredential) => {
        this.checkAdminStatus(userCredential.user);
      })
      .catch((error) => {
        console.error('Error signing in:', error);
        this.wrongpassword = true;
      });
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    this.user = null;
    this.isAdmin = false;
    location.reload();
  }

  checkAdminStatus(user: User) {
    const adminRef = ref(this.db, `admins/${user.uid}`);

    get(adminRef)
      .then((snapshot) => {
        if (snapshot.exists() && snapshot.val() === true) {
          this.user = user;
          this.isAdmin = true;
          localStorage.setItem('user', JSON.stringify(this.user));
          localStorage.setItem('isAdmin', JSON.stringify(this.isAdmin));
          location.reload();
        } else {
          this.noAdminAccess = true; // Set flag for non-admin access
        
        }
      })
      .catch((error) => {
        console.error('Error checking admin status:', error);
      });
  }
}
