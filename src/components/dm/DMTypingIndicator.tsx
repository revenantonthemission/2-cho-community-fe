interface Props {
  nickname: string;
}

export default function DMTypingIndicator({ nickname }: Props) {
  return (
    <div className="dm-typing">
      <span className="dm-typing__text">{nickname} is typing</span>
      <span className="dm-typing__dots">...</span>
    </div>
  );
}
