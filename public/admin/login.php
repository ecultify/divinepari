<?php
require_once 'config.php';

// If already logged in, redirect to dashboard
if (isLoggedIn()) {
    header('Location: dashboard.php');
    exit;
}

// Handle login form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if ($username === ADMIN_USERNAME && $password === ADMIN_PASSWORD) {
        $_SESSION['admin_logged_in'] = true;
        header('Location: dashboard.php');
        exit;
    } else {
        $error = 'Invalid credentials';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - Divine x Parimatch</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-black min-h-screen flex items-center justify-center">
    <div class="bg-gray-900 p-8 rounded-lg shadow-xl w-full max-w-md">
        <div class="text-center mb-8">
            <img src="/images/landing/normalimages/parimatch.svg" alt="Parimatch Logo" class="h-12 mx-auto mb-4">
            <h1 class="text-2xl font-bold text-yellow-400">Admin Dashboard</h1>
        </div>
        
        <?php if (isset($error)): ?>
            <div class="bg-red-500 text-white p-3 rounded mb-4 text-center">
                <?php echo htmlspecialchars($error); ?>
            </div>
        <?php endif; ?>
        
        <form method="POST" class="space-y-6">
            <div>
                <label for="username" class="block text-sm font-medium text-gray-300">Username</label>
                <input 
                    type="text" 
                    id="username" 
                    name="username" 
                    required 
                    class="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
            </div>
            
            <div>
                <label for="password" class="block text-sm font-medium text-gray-300">Password</label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    required 
                    class="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
            </div>
            
            <button 
                type="submit" 
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
                Sign In
            </button>
        </form>
    </div>
</body>
</html> 