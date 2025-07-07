<?php
require_once 'config.php';
requireLogin();

// Fetch data from Supabase with proper ordering
$user_sessions = supabaseQuery('user_sessions', 'GET', [], '*');
$user_journey = supabaseQuery('user_journey', 'GET', [], '*');
$generation_results = supabaseQuery('generation_results', 'GET', [], '*');
$image_storage = supabaseQuery('image_storage', 'GET', [], '*');
$downloads = supabaseQuery('download_tracking', 'GET', [], '*');

// Filter generation_results to only include records with user_image_uploaded == true AND user_image_url is not empty
if ($generation_results) {
    $generation_results = array_filter($generation_results, function($result) {
        return !empty($result['user_image_uploaded']) && !empty($result['user_image_url']);
    });
}

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: login.php');
    exit;
}

// Calculate enhanced stats
$successful_generations = 0;
$failed_generations = 0;
$pending_generations = 0;
$hair_swap_completed = 0;
$total_downloads = count($downloads ?? []);

if ($generation_results) {
    foreach ($generation_results as $result) {
        switch ($result['processing_status']) {
            case 'completed':
                $successful_generations++;
                break;
            case 'failed':
                $failed_generations++;
                break;
            default:
                $pending_generations++;
                break;
        }
        if ($result['hair_swap_completed']) {
            $hair_swap_completed++;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Divine x Parimatch</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
        .status-completed { @apply bg-green-100 text-white; }
        .status-failed { @apply bg-red-100 text-white; }
        .status-pending { @apply bg-yellow-100 text-white; }
    </style>
</head>
<body class="bg-black min-h-screen">
    <!-- Navigation -->
    <nav class="bg-gray-900 border-b border-gray-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center">
                    <img src="/images/landing/normalimages/parimatch.svg" alt="Parimatch Logo" class="h-8">
                    <span class="ml-4 text-yellow-400 font-bold">Admin Dashboard</span>
                </div>
                <a href="?logout" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Logout</a>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-full mx-auto py-6 sm:px-6 lg:px-8">
        <!-- Enhanced Stats Overview -->
        <div class="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <div class="bg-gray-900 p-4 rounded-lg">
                <h3 class="text-gray-400 text-xs font-medium">Total Sessions</h3>
                <p class="mt-1 text-2xl font-bold text-yellow-400"><?php echo count($user_sessions ?? []); ?></p>
            </div>
            <div class="bg-gray-900 p-4 rounded-lg">
                <h3 class="text-gray-400 text-xs font-medium">Successful</h3>
                <p class="mt-1 text-2xl font-bold text-green-400"><?php echo $successful_generations; ?></p>
            </div>
            <div class="bg-gray-900 p-4 rounded-lg">
                <h3 class="text-gray-400 text-xs font-medium">Failed</h3>
                <p class="mt-1 text-2xl font-bold text-red-400"><?php echo $failed_generations; ?></p>
            </div>
            <div class="bg-gray-900 p-4 rounded-lg">
                <h3 class="text-gray-400 text-xs font-medium">Pending</h3>
                <p class="mt-1 text-2xl font-bold text-yellow-400"><?php echo $pending_generations; ?></p>
            </div>
            <div class="bg-gray-900 p-4 rounded-lg">
                <h3 class="text-gray-400 text-xs font-medium">Hair Swaps</h3>
                <p class="mt-1 text-2xl font-bold text-blue-400"><?php echo $hair_swap_completed; ?></p>
            </div>
            <div class="bg-gray-900 p-4 rounded-lg">
                <h3 class="text-gray-400 text-xs font-medium">Downloads</h3>
                <p class="mt-1 text-2xl font-bold text-purple-400"><?php echo $total_downloads; ?></p>
            </div>
        </div>

        <!-- Comprehensive User Journey Table -->
        <div class="bg-gray-900 rounded-lg shadow mb-8">
            <div class="px-4 py-3 sm:px-6 border-b border-gray-800">
                <h2 class="text-lg font-bold text-white">Complete User Journey Tracking</h2>
                <p class="text-sm text-gray-400">All user sessions with detailed step-by-step status (scroll horizontally to see all columns)</p>
            </div>
            <div class="overflow-x-auto overflow-y-visible">
                <table class="w-full divide-y divide-gray-800 text-sm" style="min-width: 1400px;">
                    <thead class="bg-gray-800">
                        <tr>
                            <!-- Session Info -->
                            <th class="px-4 py-3 text-left font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Session ID</th>
                            <th class="px-4 py-3 text-left font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Created</th>
                            
                            <!-- User Selections -->
                            <th class="px-4 py-3 text-left font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Gender</th>
                            <th class="px-4 py-3 text-left font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Poster</th>
                            
                            <!-- Processing Status -->
                            <th class="px-4 py-3 text-left font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                            <th class="px-4 py-3 text-center font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Upload</th>
                            <th class="px-4 py-3 text-center font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Generated</th>
                            <th class="px-4 py-3 text-center font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Hair Swap</th>
                            
                            <!-- Files & URLs -->
                            <th class="px-4 py-3 text-center font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">User Image</th>
                            <th class="px-4 py-3 text-center font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Result Image</th>
                            
                            <!-- Download & Error -->
                            <th class="px-4 py-3 text-center font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Downloaded</th>
                            <th class="px-4 py-3 text-center font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Has Error</th>
                        </tr>
                    </thead>
                    <tbody class="bg-gray-900 divide-y divide-gray-800">
                        <?php if ($generation_results): ?>
                            <?php 
                            // Sort by created_at descending
                            usort($generation_results, function($a, $b) {
                                return strtotime($b['created_at']) - strtotime($a['created_at']);
                            });
                            ?>
                            <?php foreach ($generation_results as $result): ?>
                                <?php
                                // Check if downloaded
                                $downloaded = false;
                                $download_count = 0;
                                if ($downloads) {
                                    foreach ($downloads as $download) {
                                        if ($download['session_id'] === $result['session_id']) {
                                            $downloaded = true;
                                            $download_count++;
                                        }
                                    }
                                }
                                
                                // Get processing status color
                                $status_class = 'status-pending';
                                switch ($result['processing_status']) {
                                    case 'completed':
                                        $status_class = 'status-completed';
                                        break;
                                    case 'failed':
                                        $status_class = 'status-failed';
                                        break;
                                }
                                
                                // Check if there's an error
                                $has_error = !empty($result['error_message']);
                                ?>
                                <tr class="hover:bg-gray-800">
                                    <!-- Session Info -->
                                    <td class="px-4 py-3 text-gray-300 font-mono whitespace-nowrap">
                                        <?php echo htmlspecialchars(substr($result['session_id'] ?? 'N/A', -12)); ?>
                                    </td>
                                    <td class="px-4 py-3 text-gray-300 whitespace-nowrap">
                                        <?php echo htmlspecialchars(date('M j, H:i', strtotime($result['created_at'] ?? ''))); ?>
                                    </td>
                                    
                                    <!-- User Selections -->
                                    <td class="px-4 py-3 text-gray-300">
                                        <span class="px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs font-medium">
                                            <?php echo htmlspecialchars(ucfirst($result['gender'] ?? 'N/A')); ?>
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-gray-300">
                                        <span class="px-2 py-1 bg-purple-900 text-purple-200 rounded text-xs font-medium">
                                            <?php echo htmlspecialchars($result['poster_selected'] ?? 'N/A'); ?>
                                        </span>
                                    </td>
                                    
                                    <!-- Processing Status -->
                                    <td class="px-4 py-3">
                                        <span class="px-3 py-1 text-xs font-semibold rounded-full <?php echo $status_class; ?>">
                                            <?php echo htmlspecialchars(ucfirst($result['processing_status'] ?? 'Unknown')); ?>
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <?php echo $result['user_image_uploaded'] ? '<span class="text-green-400 text-lg">✓</span>' : '<span class="text-red-400 text-lg">✗</span>'; ?>
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <?php echo $result['result_image_generated'] ? '<span class="text-green-400 text-lg">✓</span>' : '<span class="text-red-400 text-lg">✗</span>'; ?>
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <?php 
                                        if ($result['hair_swap_requested']) {
                                            echo $result['hair_swap_completed'] ? '<span class="text-green-400 text-lg">✓</span>' : '<span class="text-orange-400 text-lg">⏳</span>';
                                        } else {
                                            echo '<span class="text-gray-500 text-lg">-</span>';
                                        }
                                        ?>
                                    </td>
                                    
                                    <!-- Files & URLs -->
                                    <td class="px-4 py-3 text-center">
                                        <?php if ($result['user_image_url']): ?>
                                            <a href="<?php echo htmlspecialchars($result['user_image_url']); ?>" target="_blank" class="text-blue-400 hover:text-blue-300 text-sm font-medium">View</a>
                                        <?php else: ?>
                                            <span class="text-gray-500 text-sm">No file</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <?php if ($result['generated_image_url']): ?>
                                            <a href="<?php echo htmlspecialchars($result['generated_image_url']); ?>" target="_blank" class="text-green-400 hover:text-green-300 text-sm font-medium">View</a>
                                        <?php else: ?>
                                            <span class="text-gray-500 text-sm">No file</span>
                                        <?php endif; ?>
                                    </td>
                                    
                                    <!-- Download & Error -->
                                    <td class="px-4 py-3 text-center">
                                        <?php if ($downloaded): ?>
                                            <span class="text-green-400 font-medium">✓ (<?php echo $download_count; ?>)</span>
                                        <?php else: ?>
                                            <span class="text-gray-500">✗</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <?php if ($has_error): ?>
                                            <button class="text-red-400 hover:text-red-300 text-sm font-medium cursor-pointer" 
                                                    onclick="alert('Error: <?php echo htmlspecialchars(str_replace(["'", '"'], ["\\'", '\\"'], $result['error_message'])); ?>')">
                                                View Error
                                            </button>
                                        <?php else: ?>
                                            <span class="text-green-400 text-lg">✓</span>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="12" class="px-4 py-3 text-center text-gray-400">No generation data found</td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- User Journey Steps Detail -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Recent User Journey Steps -->
        <div class="bg-gray-900 rounded-lg shadow">
                <div class="px-4 py-3 border-b border-gray-800">
                    <h2 class="text-lg font-bold text-white">Recent User Journey Steps</h2>
            </div>
                <div class="p-4 max-h-96 overflow-y-auto">
                    <?php if ($user_journey): ?>
                    <?php
                        // Sort by timestamp descending
                        usort($user_journey, function($a, $b) {
                            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
                        });
                        ?>
                        <?php foreach (array_slice($user_journey, 0, 20) as $journey): ?>
                            <div class="mb-3 p-3 bg-gray-800 rounded border-l-4 border-yellow-400">
                                <div class="flex justify-between items-start">
                    <div>
                                        <span class="text-yellow-400 font-semibold text-sm"><?php echo htmlspecialchars($journey['step']); ?></span>
                                        <span class="text-xs text-gray-400 ml-2"><?php echo htmlspecialchars(substr($journey['session_id'], -8)); ?></span>
                                    </div>
                                    <span class="text-xs text-gray-500"><?php echo htmlspecialchars(date('H:i:s', strtotime($journey['timestamp']))); ?></span>
                                </div>
                                <?php if (isset($journey['data']) && is_array($journey['data'])): ?>
                                    <div class="mt-1 text-xs text-gray-300">
                                        <?php 
                                        $data = $journey['data'];
                                        if (isset($data['action'])) echo "Action: " . htmlspecialchars($data['action']) . " ";
                                        if (isset($data['selected_gender'])) echo "Gender: " . htmlspecialchars($data['selected_gender']) . " ";
                                        if (isset($data['selected_poster'])) echo "Poster: " . htmlspecialchars($data['selected_poster']);
                                        ?>
                                    </div>
                                <?php endif; ?>
                                </div>
                            <?php endforeach; ?>
                    <?php else: ?>
                        <p class="text-gray-400 text-center">No journey data found</p>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Image Storage Overview -->
            <div class="bg-gray-900 rounded-lg shadow">
                <div class="px-4 py-3 border-b border-gray-800">
                    <h2 class="text-lg font-bold text-white">Image Storage Overview</h2>
                </div>
                <div class="p-4">
                    <?php if ($image_storage): ?>
                        <?php 
                        $total_size = 0;
                        $user_photos = 0;
                        $generated_posters = 0;
                        
                        foreach ($image_storage as $image) {
                            $total_size += $image['file_size'] ?? 0;
                            if ($image['image_type'] === 'user_photo') $user_photos++;
                            if ($image['image_type'] === 'generated_poster') $generated_posters++;
                        }
                        ?>
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div class="text-center">
                                <div class="text-2xl font-bold text-blue-400"><?php echo $user_photos; ?></div>
                                <div class="text-sm text-gray-400">User Photos</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-green-400"><?php echo $generated_posters; ?></div>
                                <div class="text-sm text-gray-400">Generated Posters</div>
                            </div>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-bold text-yellow-400"><?php echo number_format($total_size / (1024*1024), 2); ?> MB</div>
                            <div class="text-sm text-gray-400">Total Storage Used</div>
                    </div>
                    
                        <!-- Recent Files -->
                        <div class="mt-4">
                            <h4 class="text-sm font-bold text-white mb-2">Recent Files</h4>
                            <div class="space-y-2 max-h-40 overflow-y-auto">
                                <?php foreach (array_slice($image_storage, -10) as $image): ?>
                                    <div class="text-xs bg-gray-800 p-2 rounded">
                                        <div class="flex justify-between">
                                            <span class="text-gray-300"><?php echo htmlspecialchars($image['image_type']); ?></span>
                                            <span class="text-gray-500"><?php echo number_format(($image['file_size'] ?? 0) / 1024, 1); ?> KB</span>
                                    </div>
                                        <div class="text-gray-400 truncate"><?php echo htmlspecialchars($image['original_filename'] ?? 'N/A'); ?></div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <?php else: ?>
                        <p class="text-gray-400 text-center">No image storage data found</p>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </main>
</body>
</html> 