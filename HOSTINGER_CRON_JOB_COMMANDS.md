# 🕐 Hostinger Cron Job Commands - CORRECTED

## ❌ **What's Not Working:**
```bash
/usr/bin/php /home/u927284240/public_html/api/background-processor.php
```

## ✅ **Correct Commands for Hostinger:**

### **Option 1: Direct PHP Execution**
```bash
cd /home/u927284240/public_html && /usr/bin/php api/background-processor.php
```

### **Option 2: PHP with Full Path (Alternative)**
```bash
/usr/bin/php-8.1 /home/u927284240/public_html/api/background-processor.php
```

### **Option 3: Using cURL (Most Reliable)**
```bash
curl -s https://your-domain.com/api/background-processor.php
```

### **Option 4: Using wget**
```bash
wget -q -O /dev/null https://your-domain.com/api/background-processor.php
```

## 🎯 **Recommended Setup:**

**Frequency:** Every 2 minutes
```
*/2 * * * *
```

**Command (Use this one):**
```bash
curl -s https://your-domain.com/api/background-processor.php
```

## 🔍 **To Find Your Correct PHP Path:**

1. Create a test file: `test-php-path.php`
```php
<?php
echo "PHP Path: " . PHP_BINARY . "\n";
echo "PHP Version: " . phpversion() . "\n";
?>
```

2. Run in Hostinger File Manager terminal:
```bash
which php
which php-8.1
which php-8.0
```

## 📝 **Hostinger Cron Job Setup:**
1. Go to **Hostinger Control Panel** → **Advanced** → **Cron Jobs**
2. **Add New Cron Job**
3. **Frequency:** `*/2 * * * *`
4. **Command:** `curl -s https://your-domain.com/api/background-processor.php`
5. **Save**

The cURL method is most reliable because it uses HTTP requests just like a browser would.