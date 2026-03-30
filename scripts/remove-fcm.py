#!/usr/bin/env python3
"""
remove-fcm.py
Removes PushNotificationService block from AndroidManifest.xml when push is disabled.
Usage: python3 scripts/remove-fcm.py <enable_push>
"""
import re, sys

push_enabled = (sys.argv[1].strip().lower() == 'true') if len(sys.argv) > 1 else False
manifest_path = 'app/src/main/AndroidManifest.xml'

with open(manifest_path, 'r') as f:
    content = f.read()

if not push_enabled:
    # Remove FCM comment + service block
    content = re.sub(
        r'\s*<!-- FCM Push[^>]*-->\s*<service\s[^/]*/PushNotificationService[^>]*>[\s\S]*?</service>',
        '',
        content
    )
    # Also handle plain service tag without preceding comment
    content = re.sub(
        r'\s*<service\s[^>]*PushNotificationService[^>]*>[\s\S]*?</service>',
        '',
        content
    )
    print("Push disabled — PushNotificationService removed from AndroidManifest.xml")
else:
    print("Push enabled — PushNotificationService kept in AndroidManifest.xml")

# Always clean up any marker comments
content = re.sub(r'\s*<!--\s*\{\{PUSH_SERVICE_(START|END)\}\}[^>]*-->', '', content)

with open(manifest_path, 'w') as f:
    f.write(content)
