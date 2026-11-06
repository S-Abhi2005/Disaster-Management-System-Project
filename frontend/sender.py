import socket
import time

SERVER_IP = "127.0.0.1"   # Receiver’s IP (localhost for testing)
SERVER_PORT = 5000
TIMEOUT = 3

def sender(data_frames):
    seq_num = 0  # Initial sequence number
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(TIMEOUT)

    for frame in data_frames:
        ack_received = False
        while not ack_received:
            # Send frame with sequence number
            message = f"{seq_num}:{frame}"
            print(f"Sender: Sending frame '{frame}' with seq={seq_num}")
            sock.sendto(message.encode(), (SERVER_IP, SERVER_PORT))

            try:
                # Wait for ACK
                ack, _ = sock.recvfrom(1024)
                ack = ack.decode()

                if ack == str(seq_num):
                    print(f"Sender: ✅ ACK {ack} received\n")
                    ack_received = True
                    seq_num = 1 - seq_num  # Toggle sequence number
                else:
                    print("Sender: ❌ Wrong ACK, retransmitting...\n")

            except socket.timeout:
                print("Sender: ⏳ Timeout, retransmitting...\n")

    sock.close()

if __name__ == "__main__":
    frames = ["A", "B", "C", "D"]
    sender(frames)
