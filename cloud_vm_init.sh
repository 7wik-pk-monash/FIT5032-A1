#!/bin/bash
# Complete iptables setup for TeamUp application

# Clear existing rules
sudo iptables -F
sudo iptables -X
sudo iptables -t nat -F
sudo iptables -t nat -X

# Set default policies
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT

# Allow loopback
sudo iptables -A INPUT -i lo -j ACCEPT

# Allow established connections
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow SSH (CRITICAL - don't lose access!)
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow application ports
sudo iptables -A INPUT -p tcp --dport 5173 -j ACCEPT  # Vue dev
sudo iptables -A INPUT -p tcp --dport 4173 -j ACCEPT  # Vue prod
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT  # Express API
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT    # HTTP
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT   # HTTPS

# Allow ping
sudo iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT

# Save rules
sudo iptables-save > /etc/iptables/rules.v4

echo "iptables rules configured successfully!"
echo "Allowed ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001 (API), 4173 (Vue prod), 5173 (Vue dev)"

