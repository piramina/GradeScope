
# 🎓 GradeScope

### Offline Academic Performance Tracker & GPA Calculator

GradeScope is a mobile application developed using **React Native, Expo, and TypeScript** to help university students manage academic records, calculate GPA and CGPA, and monitor their academic performance.

The application follows an **offline-first approach**, using SQLite to store academic information locally on the device.

## ✨ Features

### 🏠 Academic Dashboard

- View overall CGPA and recorded credits.
- Monitor academic progress.
- View semester and course statistics.
- Access academic tools through quick actions.

### 📅 Semester Management

- Add new semesters.
- Edit existing semester details.
- Delete semesters.
- Organize academic records by semester.

### 📚 Subject Management

- Add, edit, and delete subjects.
- Manage subject codes and credit values.
- Record Theory and Practical components.
- Search and view subject details.

### 🧮 GPA & CGPA Calculator

- Calculate semester GPA.
- Calculate cumulative GPA (CGPA).
- Save course grades locally.
- Combine Theory and Practical credits for the same course.
- View recorded academic results.

### 📊 Academic Performance Analysis

- View overall CGPA and academic progress.
- Compare semester GPA results.
- Monitor completed and pending course results.
- Identify the best-performing semester.
- View rule-based academic insights.

### 📝 ICA Calculator

- Calculate internal continuous assessment marks.
- Support best-two ICA mark calculations.

### 🎯 Final Exam Predictor

- Estimate the marks required in the final examination.
- Help students plan their academic targets.

### 📱 Bottom Navigation

Navigate between the main application sections:

- Home
- Subjects
- GPA
- Analysis

### 💾 Offline Data Storage

- Store academic records using SQLite.
- Access saved information without an internet connection.
- Maintain data locally on the device.

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React Native | Mobile application development |
| Expo | React Native development framework |
| TypeScript | Type-safe application development |
| Expo Router | Screen navigation |
| Expo SQLite | Offline database |
| Lucide React Native | Icons |
| Git | Version control |
| GitHub | Source code management |

## 🚀 Getting Started

### Prerequisites

Install the following:

- Node.js and npm
- Git
- Visual Studio Code (recommended)
- Expo Go on an Android device

### 1. Clone the Repository

```bash
git clone https://github.com/piramina/GradeScope.git
```

### 2. Navigate to the Project

```bash
cd GradeScope
```

### 3. Install Dependencies

```bash
npm install
```

All required project dependencies, including Expo SQLite, will be installed automatically from `package.json`.

A separate SQLite database server is not required.

### 4. Start the Application

```bash
npx expo start
```

### 5. Run on Android

1. Connect the computer and Android device to the same Wi-Fi network.
2. Open Expo Go on the Android device.
3. Scan the QR code displayed in the terminal.
4. The GradeScope application will open on your phone.

### TypeScript Validation

To check for TypeScript errors:

```bash
npx tsc --noEmit
```

## 📂 Project Structure

```text
GradeScope/
├── src/
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── semesters.tsx
│   │   ├── subjects.tsx
│   │   ├── gpa.tsx
│   │   ├── ica.tsx
│   │   ├── predictor.tsx
│   │   └── explore.tsx
│   │
│   ├── components/
│   │   ├── bottom-navigation.tsx
│   │   └── welcome-gate.tsx
│   │
│   └── database/
│       ├── db.ts
│       ├── semester.ts
│       ├── subject.ts
│       └── gpa.ts
│
├── assets/
│
├── ScreenShots/
│   ├── Screen1.png
│   ├── Screen2.png
│   ├── Screen3.png
│   ├── Screen3_continue.png
│   ├── Screen4.png
│   ├── Screen5.png
│   ├── Screen6.png
│   ├── Screen6_continue.png
│   ├── Screen7.png
│   └── Screen7_continue.png
│
├── package.json
├── package-lock.json
└── README.md
```

## 📸 Application Screenshots

Screenshots of the GradeScope mobile application are available
in the ScreenShots folder of this repository.

The screenshots cover:
- Home Dashboard
- Semester Management
- Subject Management
- GPA & CGPA Calculator
- Academic Performance Analysis
- ICA Calculator
- Final Exam Predictor
- 
## 🎯 Project Objectives

The main objectives of GradeScope are to:

1. Simplify academic record management for university students.
2. Provide semester GPA and cumulative GPA calculations.
3. Help students monitor academic progress.
4. Support continuous assessment and final examination planning.
5. Provide an offline-first mobile application experience.

## 🔮 Future Enhancements

Potential future improvements include:

- Advanced academic performance charts.
- Academic record export and backup.
- Additional academic performance reports.
- Personalized academic planning tools.

## 🔧 Development Workflow

The project uses Git and GitHub for version control.

Development changes are maintained through Git commits and integrated using GitHub pull requests.

This approach helps maintain a clear development history and supports incremental feature implementation.

## 📄 License

This project is developed for educational and academic purposes.

No open-source license has been specified.

---

**GradeScope — Track Your Progress. Improve Your Performance. 🎓**
