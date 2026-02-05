import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Player, PlayerStats, RoomInfo } from "../types";
import { ChatMessage } from "../components/Chat";

const SERVER_URL =
  (import.meta as any).env?.VITE_SERVER_URL || "http://localhost:3000";

interface UseSocketOptions {
  myName: string;
  onGameStart: (data: {
    whiteId: string;
    blackId: string;
    whiteName: string;
    blackName: string;
    whiteStats: PlayerStats;
    blackStats: PlayerStats;
    timeSettings: any;
    startingPlayer?: Player;
  }) => void;
  onGameAction: (data: any) => void;
  onReceiveMessage: (msg: ChatMessage) => void;
  onRematchRequested: () => void;
  onOpponentLeft: () => void;
  onRoomCreated: (data: { roomId: string; roomCode: string }) => void;
  onRoomList: (rooms: RoomInfo[]) => void;
  onError: (message: string) => void;
}

export const useSocket = (options: UseSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "waiting" | "connected" | "error"
  >("idle");
  const [roomId, setRoomId] = useState<string>("");
  const [hostRoomCode, setHostRoomCode] = useState<string | null>(null);
  const [networkRole, setNetworkRole] = useState<"host" | "client" | "spectator" | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use refs to always have the latest callbacks
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const connectSocket = () => {
    if (socketRef.current?.connected) return socketRef.current;

    setConnectionStatus("connecting");
    const socket = io(SERVER_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("Connected to server", socket.id);
    });

    socket.on("connect_error", (err) => {
      setErrorMessage(
        "Could not connect to game server. Is 'node server.js' running?"
      );
      setConnectionStatus("error");
    });

    socket.on("room_created", ({ roomId, roomCode }) => {
      setRoomId(roomId);
      setHostRoomCode(roomCode);
      setConnectionStatus("waiting");
      setNetworkRole("host");
      optionsRef.current.onRoomCreated({ roomId, roomCode });
    });

    socket.on("room_list", ({ rooms: roomList }) => {
      optionsRef.current.onRoomList(roomList);
    });

    socket.on("joined_as_spectator", (data) => {
      setConnectionStatus("connected");
      setNetworkRole("spectator");
      optionsRef.current.onGameStart(data);
    });

    socket.on("game_start", (data) => {
      setConnectionStatus("connected");
      if (socket.id === data.blackId) {
        setNetworkRole("client");
      } else if (socket.id === data.whiteId) {
        setNetworkRole("host");
      }
      // If networkRole is already "spectator", don't change it
      optionsRef.current.onGameStart(data);
    });

    socket.on("game_action", (data: any) => {
      optionsRef.current.onGameAction(data);
    });

    socket.on("receive_message", (msg: ChatMessage) => {
      optionsRef.current.onReceiveMessage(msg);
    });

    socket.on("rematch_requested", () => {
      optionsRef.current.onRematchRequested();
    });

    socket.on("opponent_left", () => {
      optionsRef.current.onOpponentLeft();
      setConnectionStatus("idle");
    });

    socket.on("error", ({ message }) => {
      optionsRef.current.onError(message);
      setConnectionStatus("idle");
    });

    socketRef.current = socket;
    return socket;
  };

  const startHost = (
    isPrivate: boolean,
    timeSettings: { isTimed: boolean; initialTime: number; increment: number }
  ) => {
    if (!optionsRef.current.myName.trim()) {
      alert("Please enter your name first");
      return;
    }
    const socket = connectSocket();
    if (socket) {
      socket.emit("create_room", {
        playerName: optionsRef.current.myName,
        isPrivate,
        timeSettings,
      });
    }
  };

  const joinGame = (inputRoomId: string, roomCode?: string, asSpectator?: boolean) => {
    if (!optionsRef.current.myName.trim() && !asSpectator) {
      alert("Please enter your name first");
      return;
    }
    const socket = connectSocket();
    if (socket) {
      setRoomId(inputRoomId);
      socket.emit("join_room", {
        roomId: inputRoomId,
        playerName: asSpectator ? "" : optionsRef.current.myName,
        roomCode,
        asSpectator: asSpectator || false,
      });
    }
  };

  const cancelHosting = () => {
    if (socketRef.current) {
      if (roomId) socketRef.current.emit("leave_room", roomId);
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnectionStatus("idle");
    setNetworkRole(null);
    setRoomId("");
    setHostRoomCode(null);
  };

  const sendGameAction = (action: any) => {
    if (socketRef.current && connectionStatus === "connected") {
      socketRef.current.emit("game_action", { roomId, ...action });
    }
  };

  const requestRematch = () => {
    if (socketRef.current && roomId) {
      socketRef.current.emit("request_rematch", { roomId });
    }
  };

  const sendMessage = (text: string) => {
    if (socketRef.current && roomId) {
      socketRef.current.emit("send_message", {
        roomId,
        message: text,
        playerName: optionsRef.current.myName,
      });
    }
  };

  const getRooms = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("get_rooms");
    }
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    socketRef,
    connectionStatus,
    roomId,
    hostRoomCode,
    networkRole,
    errorMessage,
    connectSocket,
    startHost,
    joinGame,
    cancelHosting,
    sendGameAction,
    requestRematch,
    sendMessage,
    getRooms,
  };
};
