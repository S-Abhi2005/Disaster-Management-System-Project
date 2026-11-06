import socket
import random

LISTEN_IP = "127.0.0.1"
LISTEN_PORT = 5000
LOSS_PROB = 0.2   # 20% chance to lose ACK

def receiver():
    expected_seq = 0
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind((LISTEN_IP, LISTEN_PORT))
    print("Receiver is running...")

    while True:
        data, addr = sock.recvfrom(1024)
        message = data.decode()
        seq_num, frame = message.split(":")

        seq_num = int(seq_num)
        print(f"Receiver: Got frame '{frame}' with seq={seq_num}")

        if seq_num == expected_seq:
            print(f"Receiver: ✅ Accepted frame '{frame}'")
            expected_seq = 1 - expected_seq
        else:
            print(f"Receiver: ❌ Duplicate frame, discarding")

        # Simulate ACK loss
        if random.random() > LOSS_PROB:
            sock.sendto(str(seq_num).encode(), addr)
            print(f"Receiver: Sent ACK {seq_num}\n")
        else:
            print("Receiver: !! ACK lost !!\n")

if __name__ == "__main__":
    receiver()
