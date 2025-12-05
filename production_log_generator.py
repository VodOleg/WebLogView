#!/usr/bin/env python3
"""
Production-Like Log Generator
Generates realistic application logs with various log levels, components, and messages
"""

import random
import time
from datetime import datetime
import sys

# Log levels with their probabilities
LOG_LEVELS = {
    'INFO': 0.70,
    'WARN': 0.15,
    'ERROR': 0.10,
    'DEBUG': 0.04,
    'FATAL': 0.01
}

# Application components
COMPONENTS = [
    'UserService',
    'AuthService',
    'DatabasePool',
    'CacheManager',
    'APIGateway',
    'PaymentProcessor',
    'NotificationService',
    'OrderService',
    'InventoryManager',
    'MessageQueue'
]

# Sample log messages for each level
LOG_MESSAGES = {
    'INFO': [
        'Request processed successfully',
        'User logged in: user_id={}',
        'Cache hit for key: {}',
        'Database connection established',
        'API request completed in {}ms',
        'Order created: order_id={}',
        'Payment processed successfully: transaction_id={}',
        'Email sent to user: {}',
        'Session created: session_id={}',
        'Health check passed'
    ],
    'WARN': [
        'Slow query detected: execution_time={}ms',
        'Cache miss for key: {}',
        'Retry attempt {} for failed operation',
        'High memory usage detected: {}%',
        'API rate limit approaching: {}/1000 requests',
        'Connection pool nearly exhausted: {}/100 connections',
        'Deprecated API endpoint called: {}',
        'Large payload detected: {}MB'
    ],
    'ERROR': [
        'Failed to connect to database: {}',
        'Authentication failed for user: {}',
        'Invalid request payload: {}',
        'Payment processing failed: {}',
        'Service timeout: {} after {}ms',
        'Database query failed: {}',
        'Cache server unreachable: {}',
        'API request failed with status code: {}',
        'Message queue delivery failed: {}',
        'File not found: {}'
    ],
    'DEBUG': [
        'Entering method: {}',
        'Variable state: {} = {}',
        'Query parameters: {}',
        'Response headers: {}',
        'Cache key generated: {}',
        'Thread pool status: active={}, idle={}',
        'Memory allocation: {} bytes',
        'Request trace ID: {}'
    ],
    'FATAL': [
        'System out of memory',
        'Database connection pool exhausted',
        'Critical service unavailable: {}',
        'Unrecoverable error in core module: {}',
        'Disk space critically low: {}% remaining',
        'Security breach detected: {}',
        'Application shutting down due to fatal error'
    ]
}

# Sample data for placeholders
SAMPLE_DATA = {
    'user_ids': ['user_' + str(i) for i in range(1000, 9999)],
    'order_ids': ['ORD' + str(i) for i in range(100000, 999999)],
    'transaction_ids': ['TXN' + str(i) for i in range(100000, 999999)],
    'session_ids': ['sess_' + ''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=16)) for _ in range(100)],
    'cache_keys': ['cache:user:{}', 'cache:product:{}', 'cache:session:{}', 'cache:order:{}'],
    'emails': ['user{}@example.com', 'admin{}@company.com', 'customer{}@test.com'],
    'services': ['payment-service', 'auth-service', 'inventory-service', 'notification-service'],
    'endpoints': ['/api/v1/users', '/api/v1/orders', '/api/v1/products', '/api/v1/payments'],
    'errors': ['ConnectionTimeout', 'InvalidCredentials', 'ResourceNotFound', 'ValidationError']
}

def get_weighted_log_level():
    """Select a log level based on weighted probabilities"""
    rand = random.random()
    cumulative = 0
    for level, probability in LOG_LEVELS.items():
        cumulative += probability
        if rand <= cumulative:
            return level
    return 'INFO'

def format_message(template):
    """Fill in placeholders in log message templates"""
    if '{}' in template:
        placeholders = template.count('{}')
        values = []
        for _ in range(placeholders):
            value_type = random.choice(list(SAMPLE_DATA.keys()))
            if isinstance(SAMPLE_DATA[value_type], list):
                if '{}' in str(SAMPLE_DATA[value_type][0]):
                    values.append(SAMPLE_DATA[value_type][0].format(random.randint(1, 999)))
                else:
                    values.append(random.choice(SAMPLE_DATA[value_type]))
            else:
                values.append(random.randint(100, 9999))
        return template.format(*values)
    return template

def generate_log_entry():
    """Generate a single log entry"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
    level = get_weighted_log_level()
    component = random.choice(COMPONENTS)
    message_template = random.choice(LOG_MESSAGES[level])
    message = format_message(message_template)
    
    # Format: [TIMESTAMP] [LEVEL] [Component] Message
    return f"[{timestamp}] [{level:5}] [{component:20}] {message}"

def generate_logs(output_file, num_logs=1000, delay=0):
    """
    Generate production-like logs
    
    Args:
        output_file (str): Output file path
        num_logs (int): Number of log entries to generate
        delay (float): Delay between log entries in seconds (0 for no delay)
    """
    print(f"Generating {num_logs} log entries to {output_file}...")
    
    with open(output_file, 'w') as f:
        for i in range(num_logs):
            log_entry = generate_log_entry()
            f.write(log_entry + '\n')
            f.flush()  # Force write to disk immediately
            
            if delay > 0:
                time.sleep(delay)
            
            # Progress indicator
            if (i + 1) % 100 == 0:
                progress = ((i + 1) / num_logs) * 100
                print(f"Progress: {progress:.1f}% ({i + 1}/{num_logs} logs)")
    
    print(f"\n✓ Successfully generated {num_logs} log entries to {output_file}")

def main():
    # Default values
    output_file = 'application.log'
    num_logs = 1000
    delay = 0
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        num_logs = int(sys.argv[1])
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    if len(sys.argv) > 3:
        delay = float(sys.argv[3])
    
    print("Production-Like Log Generator")
    print("=" * 50)
    print(f"Output file: {output_file}")
    print(f"Number of logs: {num_logs}")
    print(f"Delay between logs: {delay}s")
    print("=" * 50)
    
    generate_logs(output_file, num_logs, delay)

if __name__ == "__main__":
    main()
