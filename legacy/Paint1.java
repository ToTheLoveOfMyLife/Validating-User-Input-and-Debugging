import java.util.InputMismatchException;
import java.util.Scanner;

public class Paint1 {
    public static void main(String[] args) {
        Scanner scnr = new Scanner(System.in);
        double wallHeight = 0.0;
        double wallWidth = 0.0;
        final double squareFeetPerGallons = 350.0;

        do {
            try {
                System.out.println("Enter wall height (feet): ");
                wallHeight = scnr.nextDouble();
                if (wallHeight <= 0) System.out.println("**Invalid Entry**");
            } catch (InputMismatchException ex) {
                System.out.println("Enter valid wall height...");
                scnr.nextLine();
            }
        } while (wallHeight <= 0);

        do {
            try {
                System.out.println("Enter wall width (feet): ");
                wallWidth = scnr.nextDouble();
                if (wallWidth <= 0) System.out.println("**Invalid Entry**");
            } catch (InputMismatchException ex) {
                System.out.println("Enter valid wall width...");
                scnr.nextLine();
            }
        } while (wallWidth <= 0);

        double wallArea = wallHeight * wallWidth;
        double gallonsPaintNeeded = wallArea / squareFeetPerGallons;
        System.out.println("Wall area: " + wallArea + " square feet");
        System.out.println("Paint needed: " + gallonsPaintNeeded + " gallons");
    }
}
