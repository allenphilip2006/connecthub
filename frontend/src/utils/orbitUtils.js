// Orbit Utils for isolation and invite management using localStorage indexing
export const getCurrentUserRooms = (userId) => {
    if (!userId) return [];
    const indexKey = `ch_orbit_index_${userId}`;
    const roomIds = JSON.parse(localStorage.getItem(indexKey) || "[]");
    return roomIds.map(id => {
        const roomData = JSON.parse(localStorage.getItem(`ch_orbit_${id}`));
        return roomData;
    }).filter(r => r !== null && new Date(r.expiresAt).getTime() > Date.now());
};

export const getMyInvites = (userId) => {
    if (!userId) return [];
    const inviteKey = `ch_invite_${userId}`;
    const invites = JSON.parse(localStorage.getItem(inviteKey) || "[]");
    return invites.filter(i => i.status === 'pending' && new Date(i.expiresAt).getTime() > Date.now());
};

export const saveRoomToUserIndex = (userId, roomId) => {
    if (!userId || !roomId) return;
    const indexKey = `ch_orbit_index_${userId}`;
    const index = JSON.parse(localStorage.getItem(indexKey) || "[]");
    if (!index.includes(roomId)) {
        index.push(roomId);
        localStorage.setItem(indexKey, JSON.stringify(index));
    }
};

export const sendInvite = (roomId, roomName, hostUser, invitedUserId) => {
    if (!roomId || !invitedUserId) return;

    // Add room to invited user's index
    saveRoomToUserIndex(invitedUserId, roomId);

    // Add pending invite record
    const inviteKey = `ch_invite_${invitedUserId}`;
    const invites = JSON.parse(localStorage.getItem(inviteKey) || "[]");
    const newInvite = {
        roomId,
        roomName,
        hostUsername: hostUser.username,
        hostAvatar: hostUser.avatar,
        expiresAt: hostUser.expiresAt,
        status: 'pending'
    };
    invites.push(newInvite);
    localStorage.setItem(inviteKey, JSON.stringify(invites));

    // Update room object invites array
    const roomKey = `ch_orbit_${roomId}`;
    const room = JSON.parse(localStorage.getItem(roomKey));
    if (room) {
        if (!room.invites) room.invites = [];
        if (!room.invites.includes(invitedUserId)) {
            room.invites.push(invitedUserId);
            localStorage.setItem(roomKey, JSON.stringify(room));
        }
    }
};

export const acceptInvite = (roomId, userId) => {
    if (!roomId || !userId) return;

    // Update invite status
    const inviteKey = `ch_invite_${userId}`;
    const invites = JSON.parse(localStorage.getItem(inviteKey) || "[]");
    const updatedInvites = invites.map(i => i.roomId === roomId ? { ...i, status: 'accepted' } : i);
    localStorage.setItem(inviteKey, JSON.stringify(updatedInvites));

    // Add user to room participants
    const roomKey = `ch_orbit_${roomId}`;
    const room = JSON.parse(localStorage.getItem(roomKey));
    if (room) {
        if (!room.participants) room.participants = [];
        const exists = room.participants.find(p => p.id === userId);
        if (!exists) {
            // Need to fetch user profile for this - assuming user object passed in or fetched elsewhere
            // For now, adding basic structure - ideally the caller passes user profile
            room.participants.push({ id: userId, status: 'ACTIVE' });
            localStorage.setItem(roomKey, JSON.stringify(room));
        }
    }
};

export const declineInvite = (roomId, userId) => {
    if (!roomId || !userId) return;
    const inviteKey = `ch_invite_${userId}`;
    const invites = JSON.parse(localStorage.getItem(inviteKey) || "[]");
    const updatedInvites = invites.map(i => i.roomId === roomId ? { ...i, status: 'declined' } : i);
    localStorage.setItem(inviteKey, JSON.stringify(updatedInvites));
};

export const joinByCode = (inviteCode, userId, userProfile) => {
    if (!inviteCode || !userId) return { success: false, error: 'Invalid input' };

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('ch_orbit_') && !key.includes('_index_')) {
            try {
                const room = JSON.parse(localStorage.getItem(key));
                if (room.inviteCode === inviteCode.toUpperCase()) {
                    if (new Date(room.expiresAt).getTime() < Date.now()) {
                        return { success: false, error: 'Room expired' };
                    }
                    if (room.participants?.length >= (room.maxParticipants || 20)) {
                        return { success: false, error: 'Room is full' };
                    }

                    if (!room.participants) room.participants = [];
                    if (!room.participants.find(p => p.id === userId)) {
                        room.participants.push({
                            id: userId,
                            username: userProfile.username,
                            avatar: userProfile.profileImage,
                            status: 'ACTIVE'
                        });
                        localStorage.setItem(key, JSON.stringify(room));
                        saveRoomToUserIndex(userId, room.id);
                    }
                    return { success: true, roomId: room.id };
                }
            } catch (_e) { /* swallow parse errors */ }
        }
    }
    return { success: false, error: 'Invalid code' };
};
