interface AnswerGroupProps {
  children: React.ReactNode;
}

export function AnswerGroup({ children }: AnswerGroupProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {children}
    </div>
  );
}
