interface MentionUser {
  user_id: number;
  nickname: string;
  profileImageUrl: string | null;
}

interface Props {
  users: MentionUser[];
  selectedIndex: number;
  onSelect: (user: MentionUser) => void;
}

export default function MentionDropdown({ users, selectedIndex, onSelect }: Props) {
  if (users.length === 0) return null;

  return (
    <ul className="mention-dropdown" id="mention-listbox" role="listbox" aria-label="멘션 사용자 목록">
      {users.map((user, i) => (
        <li
          key={user.user_id}
          id={`mention-option-${user.user_id}`}
          role="option"
          aria-selected={i === selectedIndex}
          className={`mention-dropdown-item${i === selectedIndex ? ' selected' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); onSelect(user); }}
        >
          <div
            className="mention-dropdown-avatar"
            style={
              user.profileImageUrl
                ? { backgroundImage: `url(${user.profileImageUrl})`, backgroundSize: 'cover' }
                : undefined
            }
          >
            {!user.profileImageUrl && user.nickname?.charAt(0).toUpperCase()}
          </div>
          <span className="mention-dropdown-name">{user.nickname}</span>
        </li>
      ))}
    </ul>
  );
}
