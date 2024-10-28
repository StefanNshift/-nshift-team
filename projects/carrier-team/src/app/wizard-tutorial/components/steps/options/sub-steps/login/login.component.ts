import { Component, OnInit } from '@angular/core';
import { Database, ref, get, update, push, remove } from '@angular/fire/database'; // Firebase Database modules
import { Auth, signInWithEmailAndPassword, User } from '@angular/fire/auth'; // Firebase Auth modules

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styles: [],
})
export class LoginComponent

 implements OnInit {
  constructor(private db: Database, private auth: Auth) {} // Inject Database and Auth

  email: string = '';  // For the login form
  password: string = ''; // For the login form
  user: User | null = null; // Hold the logged-in user
  isAdmin: boolean = false; // Check if the user is admin
  wrongpassword: boolean;



  ngOnInit() {

    // Check if the user and admin status are stored in localStorage
    const storedUser = localStorage.getItem('user');
    const storedAdmin = localStorage.getItem('isAdmin');

    if (storedUser && storedAdmin) {
      this.user = JSON.parse(storedUser);
      this.isAdmin = JSON.parse(storedAdmin) === true;

      if (this.isAdmin) {
      }
    }
  }


onLogin() {
  this.wrongpassword = false;
  signInWithEmailAndPassword(this.auth, this.email, this.password)
    .then((userCredential) => {
      this.user = userCredential.user;
      this.checkAdminStatus(this.user);
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
      if (snapshot.exists()) {
        this.isAdmin = snapshot.val();
        localStorage.setItem('user', JSON.stringify(this.user));
        localStorage.setItem('isAdmin', JSON.stringify(this.isAdmin));

        if (this.isAdmin) {
          location.reload();
          
        }
      } else {
        console.log('User is not an admin.');
      }
    })
    .catch((error) => {
      console.error('Error checking admin status:', error);
    });
}


 }