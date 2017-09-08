all: server/target/release/klondike

server/target/release/klondike:
	cd server && cargo rustc --release -- -C target-cpu=native
