import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

export function StatCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string | number;
  caption?: string;
}) {
  return (
    <Card variant="outlined" sx={{ minWidth: 200 }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" component="div" sx={{ mt: 1 }}>
          {value}
        </Typography>
        {caption ? (
          <Typography variant="caption" color="text.secondary">
            {caption}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}
