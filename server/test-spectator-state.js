import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';

console.log('Testing spectator state synchronization...\n');

// Player 1 (White) creates a room
const player1 = io(SERVER_URL, { transports: ['websocket'] });
let roomId = null;

player1.on('connect', () => {
  console.log('[Player1] Connected as', player1.id);
  player1.emit('create_room', {
    playerName: 'Player1',
    isPrivate: false,
    timeSettings: { isTimed: true, initialTime: 300, increment: 5 }
  });
});

player1.on('room_created', (data) => {
  console.log('[Player1] Room created:', data.roomId);
  roomId = data.roomId;
  
  // Player 2 (Black) joins after 1 second
  setTimeout(() => {
    const player2 = io(SERVER_URL, { transports: ['websocket'] });
    
    player2.on('connect', () => {
      console.log('[Player2] Connected as', player2.id);
      player2.emit('join_room', {
        roomId: roomId,
        playerName: 'Player2',
        asSpectator: false
      });
    });
    
    player2.on('game_start', (data) => {
      console.log('[Player2] Game started! White:', data.whiteName, 'Black:', data.blackName);
      
      // Player 1 makes a move
      setTimeout(() => {
        console.log('[Player1] Making first move...');
        player1.emit('game_action', {
          roomId: roomId,
          type: 'MOVE',
          block: {
            id: 'block1',
            x: 0,
            y: 0,
            orientation: 'vertical',
            player: 'white'
          },
          nextPlayer: 'black',
          wTime: 305,
          bTime: 300,
          isDraw: false,
          gameEnded: false,
          winner: null
        });
        
        // Player 2 makes a move
        setTimeout(() => {
          console.log('[Player2] Making second move...');
          player2.emit('game_action', {
            roomId: roomId,
            type: 'MOVE',
            block: {
              id: 'block2',
              x: 1,
              y: 0,
              orientation: 'vertical',
              player: 'black'
            },
            nextPlayer: 'white',
            wTime: 305,
            bTime: 305,
            isDraw: false,
            gameEnded: false,
            winner: null
          });
          
          // Spectator joins after moves are made
          setTimeout(() => {
            const spectator = io(SERVER_URL, { transports: ['websocket'] });
            
            spectator.on('connect', () => {
              console.log('\n[Spectator] Connected as', spectator.id);
              console.log('[Spectator] Joining game as spectator...');
              spectator.emit('join_room', {
                roomId: roomId,
                playerName: '',
                asSpectator: true
              });
            });
            
            spectator.on('joined_as_spectator', (data) => {
              console.log('\n=== SPECTATOR RECEIVED DATA ===');
              console.log('White:', data.whiteName, 'Black:', data.blackName);
              console.log('Game started:', data.gameStarted);
              console.log('Current player:', data.currentPlayer);
              console.log('Number of blocks:', data.blocks ? data.blocks.length : 0);
              console.log('White time:', data.whiteTime);
              console.log('Black time:', data.blackTime);
              
              if (data.blocks) {
                console.log('\nBlocks on board:');
                data.blocks.forEach((block, idx) => {
                  console.log(`  Block ${idx + 1}: ${block.player} at (${block.x}, ${block.y}) - ${block.orientation}`);
                });
              }
              
              console.log('\n=== TEST RESULTS ===');
              const hasBlocks = data.blocks && data.blocks.length === 2;
              const hasCurrentPlayer = data.currentPlayer === 'white';
              const hasTimes = data.whiteTime === 305 && data.blackTime === 305;
              
              console.log('✓ Blocks sent to spectator:', hasBlocks ? 'PASS' : 'FAIL');
              console.log('✓ Current player sent:', hasCurrentPlayer ? 'PASS' : 'FAIL');
              console.log('✓ Timer state sent:', hasTimes ? 'PASS' : 'FAIL');
              
              if (hasBlocks && hasCurrentPlayer && hasTimes) {
                console.log('\n✅ ALL TESTS PASSED! Spectators now receive game state.');
              } else {
                console.log('\n❌ SOME TESTS FAILED');
              }
              
              // Clean up
              setTimeout(() => {
                player1.disconnect();
                player2.disconnect();
                spectator.disconnect();
                process.exit(hasBlocks && hasCurrentPlayer && hasTimes ? 0 : 1);
              }, 500);
            });
            
            spectator.on('error', (error) => {
              console.error('[Spectator] Error:', error.message);
              player1.disconnect();
              player2.disconnect();
              spectator.disconnect();
              process.exit(1);
            });
          }, 1000);
        }, 500);
      }, 500);
    });
    
    player2.on('error', (error) => {
      console.error('[Player2] Error:', error.message);
      player1.disconnect();
      player2.disconnect();
      process.exit(1);
    });
  }, 1000);
});

player1.on('error', (error) => {
  console.error('[Player1] Error:', error.message);
  player1.disconnect();
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('\n❌ Test timed out after 10 seconds');
  process.exit(1);
}, 10000);
