const userDetails = document.querySelector('.userDetails');
const editProfile = document.querySelector('#editProfile');


function createUserCollection(user, downloadURL) {
  firebase.firestore().collection('users')
    .doc(user.email)
    .set({
      uid: user.uid,
      name: user.displayName,
      age:"",
      gender:"",
      email: user.email,
      ambientT: "",
      bodyT: "",
      file_name: "",
      file_url: "",
      hr: "",
      spo2: "",
      phoneno:"",
      clinicalHistory:"",
      photoURL: downloadURL
    });
    
}

async function getuserInfoRealtime(user) {
  if (user) {
    const userdocRef = await firebase.firestore().collection('users').doc(user.email);
    userdocRef.onSnapshot((doc) => {
      if (doc.exists) {
        const userInfo = doc.data();
        if (userInfo) {
          userDetails.innerHTML = `
            <table class="highlight">
              <tbody>
                <tr>
                  <td>Ambient T</td>
                  <td>${userInfo.ambientT}</td>
                </tr>
                <tr>
                  <td>Body T</td>
                  <td>${userInfo.bodyT}</td>
                </tr>
                <tr>
                  <td>File Name</td>
                  <td>${userInfo.file_name}</td>
                </tr>
                <tr>
                  <td>File URL</td>
                  <td><a href="${userInfo.file_url}" download>Download File</a></td>
                </tr>
                <tr>
                  <td>HR</td>
                  <td>${userInfo.hr}</td>
                </tr>
                <tr>
                  <td>SPO2</td>
                  <td>${userInfo.spo2}</td>
                </tr>
                <tr>
                  <td>User ID</td>
                  <td>${userInfo.user_id}</td>
                </tr>
                <tr>
                  <td>Name</td>
                  <td>${userInfo.name}</td>
                </tr>
                <tr>
                  <td>Age</td>
                  <td>${userInfo.age}</td>
                </tr>
                <tr>
                  <td>Gender</td>
                  <td>${userInfo.gender}</td>
                </tr>
                <tr>
                  <td>Phone Number</td>
                  <td>${userInfo.phoneno}</td>
                </tr>
                <tr>
                  <td>Clinical History</td>
                  <td>${userInfo.clinicalHistory}</td>
                </tr>
              </tbody>
            </table>
            <button class="btn waves-effect #fbc02d yellow darken-2 modal-trigger" href="#modal3">Edit Details</button>
          `;
          if (userInfo.photoURL) {
            document.querySelector('#proimg').src = userInfo.photoURL;
          } else {
            document.querySelector('#proimg').src = './assets/noimage.png';
          }
          const fileURL = userInfo.file_url;
          plotECGSignal(user.email);
          plotPPGSignal(user.email);

        }
      }
    });
  } else {
    userDetails.innerHTML = `
      <h3>Please login</h3>
    `;
  }
}





function uploadImage(e) {
  console.log(e.target.files[0]);
  const uid = firebase.auth().currentUser.uid;
  const email2= firebase.auth().currentUser.email;
  
  const fileRef = firebase.storage().ref().child(`users/${email2}/${e.target.files[0].name}`);

  const uploadTask = fileRef.put(e.target.files[0]);
  uploadTask.on('state_changed',
    (snapshot) => {
      var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      if (progress == '100') alert('uploaded');
    },
    (error) => {
      console.log(error);
    },
    () => {
      uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
        console.log('File available at', downloadURL);
        document.querySelector('#proimg').src = downloadURL;
        firebase.auth().currentUser.updateProfile({
          photoURL: downloadURL
        });
        const user = firebase.auth().currentUser;
        
      });
    }
  );
}

async function allUserDetails() {
  document.getElementById('table').style.display = 'table';
  const userRef = await firebase.firestore().collection('users').get();
  userRef.docs.forEach((doc) => {
    const info = doc.data();
    const downloadButton = `<a href="${info.file_url}" download>Download</a>`;
    document.getElementById('tbody').innerHTML += `
      <tr>
        <td>${info.name}</td>
        <td>${info.email}</td>
        <td>${info.age}</td>
        <td>${info.gender}</td>
        <td>${info.phoneno}</td>
        <td>${info.ambientT.toFixed(2)}</td>
        <td>${info.bodyT.toFixed(2)}</td>
        <td>${info.hr.toFixed(2)}</td>
        <td>${info.spo2.toFixed(2)}</td>
        <td>${info.clinicalHistory}</td>
        <td>${info.file_name}</td>
        <!--<td>${info.file_url}</td>-->
        <td>${downloadButton}</td>
      </tr>
    `;
  });
}


async function updateUserProfile(event) {
  event.preventDefault();

  const userDocRef = firebase.firestore().collection('users').doc(firebase.auth().currentUser.email);

  // Fetch the current user document
  const doc = await userDocRef.get();
  const existingData = doc.data();

  const name = editProfile['name'].value;
  const age = editProfile['age'].value;
  const gender = editProfile['gender'].value;
  const phoneno = editProfile['phoneno'].value;
  const address = editProfile['address'].value;
  const clinicalHistory = editProfile['clinicalHistory'].value;
  

  const updateData = {};

  // Merge existing data with updated fields
 
  if (name !== '') {
    updateData.name = name;
  } else {
    updateData.name = existingData.name; // Preserve existing value
  }

  if (age !== '') {
    updateData.age = age;
  } else {
    updateData.age = existingData.age; // Preserve existing value
  }

  if (gender !== '') {
    updateData.gender = gender;
  } else {
    updateData.gender = existingData.gender; // Preserve existing value
  }

  if (phoneno !== '') {
    updateData.phoneno = phoneno;
  } else {
    updateData.phoneno = existingData.phoneno; // Preserve existing value
  }

  if (address !== '') {
    updateData.address = address;
  } else {
    updateData.address = existingData.address; // Preserve existing value
  }

  if (clinicalHistory !== '') {
    updateData.clinicalHistory = clinicalHistory;
  } else {
    updateData.clinicalHistory = existingData.clinicalHistory; // Preserve existing value
  }

  userDocRef.update(updateData);

  M.Modal.getInstance(myModel[2]).close();
}

function plotECGSignal(email1) {
  // Assuming you have included Chart.js library in your HTML file
  const ecgCanvas = document.getElementById('ecgChart');
  const ecgCtx = ecgCanvas.getContext('2d');

  // Assuming you have already authenticated the user and obtained their email

  // Get the Firestore reference for the user's document
  const firestore = firebase.firestore();
  const userEmail = email1; // Replace with the user's email
  const userRef = firestore.collection('users').doc(userEmail);
  
  userRef.get()
    .then((doc) => {
      if (doc.exists) {
        const fileName = doc.data().file_name; // Get the file name from the Firestore document
        const storageRef = firebase.storage().ref(`users/${userEmail}/${fileName}`);

        storageRef.getDownloadURL()
          .then((url) => {
            fetch(url)
              .then((response) => response.text())
              .then((data) => {
                const ecgData = parseCSV(data, 'ECG'); // Parse the ECG column from the CSV data

                const ecgChart = new Chart(ecgCtx, {
                  type: 'line',
                  data: {
                    labels: ecgData.labels,
                    datasets: [
                      {
                        label: 'ECG Signal',
                        data: ecgData.values,
                        borderColor: 'blue',
                        fill: false,
                      },
                    ],
                  },
                  options: {
                    responsive: true,
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Time',
                        },
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'ECG Value',
                        },
                      },
                    },
                  },
                });
              })
              .catch((error) => {
                console.log('Error fetching ECG data:', error);
              });
          })
          .catch((error) => {
            console.log('Error retrieving download URL:', error);
          });
      } else {
        console.log('User document does not exist');
      }
    })
    .catch((error) => {
      console.log('Error retrieving user document:', error);
    });
}


function plotPPGSignal(email1) {
  // Assuming you have included Chart.js library in your HTML file
  const ppgCanvas = document.getElementById('ppgChart');
  const ppgCtx = ppgCanvas.getContext('2d');

  // Assuming you have already authenticated the user and obtained their email
  
  // Get the Firestore reference for the user's document
  const firestore = firebase.firestore();
  const userEmail = email1; // Replace with the user's email
  const userRef = firestore.collection('users').doc(userEmail);
  
  userRef.get()
    .then((doc) => {
      if (doc.exists) {
        const fileName = doc.data().file_name; // Get the file name from the Firestore document
        const storageRef = firebase.storage().ref(`users/${userEmail}/${fileName}`);

        storageRef.getDownloadURL()
          .then((url) => {
            fetch(url)
              .then((response) => response.text())
              .then((data) => {
                const ppgData = parseCSV(data, 'PPG_IR'); // Parse the PPG_IR column from the CSV data

                const ppgChart = new Chart(ppgCtx, {
                  type: 'line',
                  data: {
                    labels: ppgData.labels,
                    datasets: [
                      {
                        label: 'PPG Signal',
                        data: ppgData.values,
                        borderColor: 'red',
                        fill: false,
                      },
                    ],
                  },
                  options: {
                    responsive: true,
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Time',
                        },
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'PPG Value',
                        },
                      },
                    },
                  },
                });
              })
              .catch((error) => {
                console.log('Error fetching PPG data:', error);
              });
          })
          .catch((error) => {
            console.log('Error retrieving download URL:', error);
          });
      } else {
        console.log('User document does not exist');
      }
    })
    .catch((error) => {
      console.log('Error retrieving user document:', error);
    });
}


function plotPPGSignal2(fileURL) {
  fetch(fileURL)
    .then((response) => response.text())
    .then((data) => {
      const ppgData = parseCSV(data, 'PPG_IR'); // Parse the PPG_IR column from the CSV data

      // Assuming you have included Chart.js library in your HTML file
      const ppgCanvas = document.getElementById('ppgChart');
      const ppgCtx = ppgCanvas.getContext('2d');

      const ppgChart = new Chart(ppgCtx, {
        type: 'line',
        data: {
          labels: ppgData.labels,
          datasets: [
            {
              label: 'PPG Signal',
              data: ppgData.values,
              borderColor: 'red',
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Time',
              },
            },
            y: {
              title: {
                display: true,
                text: 'PPG Value',
              },
            },
          },
        },
      });
    })
    .catch((error) => {
      console.log('Error fetching PPG data:', error);
    });
}


function parseCSV(csvData, columnName) {
  const lines = csvData.split('\n');
  const labels = [];
  const values = [];

  // Find the index of the specified column
  const header = lines[0].split(',');
  const columnIndex = header.indexOf(columnName);

  // Parse the values from the specified column
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].split(',');
    labels.push(line[columnIndex]); // Extract the timestamp as label
    values.push(parseFloat(line[columnIndex + 1])); // Assuming the value is in the next column
  }

  return {
    labels,
    values,
  };
}
